const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  canSend,
  getLastAlertTime,
  setLastAlertTime,
  formatTimeAgo,
} = require("../state/freeScanLock");
const templates = require("../utils/freeSignalTemplates");
const {
  calcRSI,
  getEMA200Trend,
  getMACDSignal,
  getHeikinAshiCandle,
} = require("../../lib/indicators/ta");
const binanceEngine = require("../../workers/binanceSignalEngine");
const {
  getTopSymbols,
  startAutoUpdate,
} = require("../utils/binanceSymbols");
const localData = require("../utils/localData");

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const KIMP_COOLDOWN_MS = 10 * 60 * 1000;
const WHALE_COOLDOWN_MS = 45 * 60 * 1000; // v2.3b: 60분 → 45분
const MAX_SIGNALS_PER_MINUTE = 3;
const MAX_SIGNALS_PER_10MIN = 3;
const MAX_SIGNALS_PER_HOUR = 12;

const KIMP_DIFF_THRESHOLD = 0.35;
const KIMP_ABSOLUTE_THRESHOLD = 1.0;

const kimpHistory = new Map();
const minuteSignalLog = new Map();
const signalTimestamps = []; // 전체 신호 타임스탬프 기록

// ===== 추세 판정 함수 (보조 필터용) =====
// Binance 24h ticker 기준, "상승/하락 기울기"만 대략 걸러내는 용도
function isUptrend(ticker) {
  // 상승추세: 24h 가격 변동률 >= +1.5%
  return (
    ticker &&
    ticker.priceChange !== undefined &&
    ticker.priceChange !== null &&
    ticker.priceChange >= 1.5
  );
}

function isDowntrend(ticker) {
  // 하락추세: 24h 가격 변동률 <= -1.5%
  return (
    ticker &&
    ticker.priceChange !== undefined &&
    ticker.priceChange !== null &&
    ticker.priceChange <= -1.5
  );
}

// ===== 고래 신호 조건 함수 (추가 필터) =====
function shouldSendWhaleBuy(whaleData, ticker) {
  /**
   * 고래 매수 시그널:
   * - side === '매수'
   * - 1분 체결 금액 ≥ 10,000 USDT
   * - 24h 기준 상승 추세
   *
   * (기본 고래 조건: binanceSignalEngine.checkWhaleCondition 안에서 이미 체크됨)
   */
  if (!whaleData || !ticker) return false;

  if (whaleData.side !== "매수") return false;
  if ((whaleData.volume_usdt || 0) < 10000) return false;
  if (!isUptrend(ticker)) return false;

  return true;
}

function shouldSendWhaleSell(whaleData, ticker) {
  /**
   * 고래 매도 시그널:
   * - side === '매도'
   * - 1분 체결 금액 ≥ 10,000 USDT
   * - 24h 기준 하락 추세
   */
  if (!whaleData || !ticker) return false;

  if (whaleData.side !== "매도") return false;
  if ((whaleData.volume_usdt || 0) < 10000) return false;
  if (!isDowntrend(ticker)) return false;

  return true;
}

// ===== 김프 신호 조건 함수 (v2.4) =====
function shouldSendKimpLong(coin, kimpChange) {
  /**
   * 김프 기반 매수(롱) 시그널:
   * - 김프가 빠르게 올라가는
   */
  if (!coin) return false;

  const premium = parseFloat(coin.premium || 0);
  const premiumAbs = Math.abs(premium);

  // 기본 김프 급변 조건
  if (kimpChange < 0.35) return false; // 5분 변화 0.35%p 미만
  if (premiumAbs < 1.0) return false; // 절대 김프 1.0% 미만

  return true;
}

function shouldSendKimpShort(coin, kimpChange) {
  /**
   * 김프 기반 매도(숏) 시그널:
   * - 김프가 빠르게 내려가는
   */
  if (!coin) return false;

  const premium = parseFloat(coin.premium || 0);
  const premiumAbs = Math.abs(premium);

  // 기본 김프 급변 조건
  if (kimpChange > -0.35) return false; // 5분 변화 -0.35%p 이상
  if (premiumAbs < 1.0) return false; // 절대 김프 1.0% 미만

  return true;
}

// ===== 분당/10분/1시간 스팸 방지 =====
function getOrCreateMinuteLog() {
  const now = Math.floor(Date.now() / 60000) * 60000;
  const key = `minute:${now}`;

  if (!minuteSignalLog.has(key)) {
    minuteSignalLog.set(key, []);

    const cutoff = now - 5 * 60000;
    for (const [k] of minuteSignalLog) {
      if (k.startsWith("minute:")) {
        const time = parseInt(k.split(":")[1], 10);
        if (time < cutoff) {
          minuteSignalLog.delete(k);
        }
      }
    }
  }

  return minuteSignalLog.get(key);
}

function canSendWhaleSignal() {
  const now = Date.now();

  // 1분 내 3개 초과
  const minuteLog = getOrCreateMinuteLog();
  if (minuteLog.length >= MAX_SIGNALS_PER_MINUTE) return false;

  // 10분 내 3개 초과
  const last10min = signalTimestamps.filter((t) => now - t < 10 * 60000);
  if (last10min.length >= MAX_SIGNALS_PER_10MIN) return false;

  // 1시간 내 12개 초과
  const lastHour = signalTimestamps.filter((t) => now - t < 60 * 60000);
  if (lastHour.length >= MAX_SIGNALS_PER_HOUR) return false;

  return true;
}

function recordWhaleSignal(symbol) {
  const minuteLog = getOrCreateMinuteLog();
  minuteLog.push(symbol);
  signalTimestamps.push(Date.now());

  // 2시간 이상 지난 로그 제거
  const cutoff = Date.now() - 2 * 60 * 60000;
  while (signalTimestamps.length > 0 && signalTimestamps[0] < cutoff) {
    signalTimestamps.shift();
  }
}

// ===== 김프 히스토리 관리 =====
function recordKimpHistory(symbol, premium) {
  if (!kimpHistory.has(symbol)) {
    kimpHistory.set(symbol, []);
  }
  const history = kimpHistory.get(symbol);
  history.push({ time: Date.now(), premium });

  const cutoff = Date.now() - 10 * 60 * 1000;
  while (history.length > 0 && history[0].time < cutoff) {
    history.shift();
  }
}

function getPremium5minAgo(symbol) {
  const history = kimpHistory.get(symbol);
  if (!history || history.length === 0) return null;

  const targetTime = Date.now() - 5 * 60 * 1000;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].time <= targetTime) {
      return history[i].premium;
    }
  }

  return history[0].premium;
}

/**
 * Python 차트 생성 (Railway 대응 버전)
 * - 기본 명령: python3
 * - 필요시 환경변수 PYTHON_CMD=python 으로 오버라이드 가능
 */
async function generatePythonChart(symbol) {
  // freeSignals.js: /app/src/bot/schedulers
  // → ../../chart/priceChart.py = /app/src/chart/priceChart.py
  const scriptPath = path.join(__dirname, "../../chart/priceChart.py");

  if (!fs.existsSync(scriptPath)) {
    console.warn("[Chart] Python script not found:", scriptPath);
    return null;
  }

  const pythonCmd = process.env.PYTHON_CMD || "python3";

  try {
    console.log(
      `[Chart] Generating chart for ${symbol} using ${pythonCmd} ${scriptPath}`,
    );

    const result = execSync(
      `${pythonCmd} "${scriptPath}" ${symbol}USDT 5m`,
      {
        encoding: "utf-8",
        timeout: 30000,
        cwd: process.cwd(),
      },
    );

    const chartPath = result.trim();

    if (chartPath && fs.existsSync(chartPath)) {
      console.log(`[Chart] Generated: ${chartPath}`);
      return chartPath;
    }

    console.warn("[Chart] Script finished but file not found:", chartPath);
    return null;
  } catch (err) {
    console.error(
      `[Chart] Generation failed for ${symbol}:`,
      err.message || err,
    );
    return null;
  }
}

// ===== 김프 시그널 =====
async function runKimpSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const data = localData.getPremiumFiltered(
      "UPBIT",
      "KRW",
      "BINANCE",
      "USDT",
    );
    if (!data || !Array.isArray(data) || data.length === 0) return;

    for (const symbol of ["BTC", "ETH"]) {
      const coin = data.find((c) => c.symbol === symbol);
      if (!coin) continue;

      const premiumNow = parseFloat(coin.premium || 0);
      recordKimpHistory(symbol, premiumNow);

      const premiumPrev = getPremium5minAgo(symbol);
      if (premiumPrev === null) continue;

      const diff = premiumNow - premiumPrev;
      const diffAbs = Math.abs(diff);
      const premiumAbs = Math.abs(premiumNow);

      // v2.4 김프 급변 조건
      if (diffAbs < KIMP_DIFF_THRESHOLD) continue; // 5분 변화 0.35%p 미만
      if (premiumAbs < KIMP_ABSOLUTE_THRESHOLD) continue; // |김프| 1.0% 미만
      if (!canSend("KIMP", symbol, KIMP_COOLDOWN_MS)) continue; // 쿨다운

      const isLong = diff > 0;
      const isShort = diff < 0;

      if (isLong && !shouldSendKimpLong(coin, diff)) continue;
      if (isShort && !shouldSendKimpShort(coin, diff)) continue;

      // 보조지표 정보
      const ticker = binanceEngine.get24hData(`${symbol}USDT`);
      const candles1h = binanceEngine.getCandles1h(symbol);
      const rsiValue = calcRSI(candles1h, 14);
      const ema200Trend = getEMA200Trend(candles1h);
      const macdSignal = getMACDSignal(candles1h);
      const haCandle =
        candles1h.length > 0
          ? getHeikinAshiCandle(candles1h[candles1h.length - 1])
          : "N/A";
      const lastAlertTime = getLastAlertTime("KIMP", symbol);
      const lastAlertAgo = formatTimeAgo(lastAlertTime);
      setLastAlertTime("KIMP", symbol);

      const messageData = {
        symbol,
        price_krw: coin.domesticPrice || coin.korean_price || 0,
        price_usd: coin.foreignPrice || coin.global_price || 0,
        premium_now: premiumNow.toFixed(2),
        premium_prev: premiumPrev.toFixed(2),
        premium_diff: diff.toFixed(2),
        // 보조지표
        ema200_trend: ema200Trend,
        rsi_value: rsiValue,
        macd_signal: macdSignal,
        ha_candle: haCandle,
        change_24h: (ticker?.priceChange || 0).toFixed(2),
        volume_24h_usdt: ticker?.volume || 0,
        last_alert_ago: lastAlertAgo,
      };

      const message = templates.kimpSignal(messageData);

      try {
        const chartPath = await generatePythonChart(symbol);
        if (chartPath) {
          await bot.telegram.sendPhoto(
            CHANNEL_ID,
            { source: chartPath },
            { caption: message },
          );
          fs.unlinkSync(chartPath);
        } else {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        }
        console.log(
          `✅ [KIMP] ${symbol} 김프 급변 시그널 전송 (${diff.toFixed(
            2,
          )}%p)`,
        );
      } catch (sendErr) {
        console.error(`[KIMP] ${symbol} 전송 실패:`, sendErr.message);
        try {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        } catch (fallbackErr) {
          console.error(
            `[KIMP] ${symbol} 텍스트 전송도 실패:`,
            fallbackErr.message,
          );
        }
      }
    }
  } catch (err) {
    console.error("[KIMP Signal] Error:", err.message);
  }
}

// ===== 고래 시그널 =====
async function runWhaleSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const topSymbols = await getTopSymbols();
    const symbolsWithoutSuffix = topSymbols.map((s) =>
      s.replace("USDT", ""),
    );

    for (const symbol of symbolsWithoutSuffix) {
      if (!canSendWhaleSignal()) {
        console.log(
          `⏭️ [WHALE] ${symbol}: 1분/10분/1시간 한도 초과 (폭주 방지)`,
        );
        continue;
      }

      const whaleData = binanceEngine.checkWhaleCondition(symbol);
      if (!whaleData) continue;

      const ticker = binanceEngine.get24hData(`${symbol}USDT`);

      // 방향성 필터 (보조)
      const isBuySignal = whaleData.side === "매수";
      const isSellSignal = whaleData.side === "매도";

      if (isBuySignal && !shouldSendWhaleBuy(whaleData, ticker)) {
        console.log(
          `⏭️ [WHALE] ${symbol}: 상승추세 부족 / 거래액 부족 (매수 고래 필터됨)`,
        );
        continue;
      }
      if (isSellSignal && !shouldSendWhaleSell(whaleData, ticker)) {
        console.log(
          `⏭️ [WHALE] ${symbol}: 하락추세 부족 / 거래액 부족 (매도 고래 필터됨)`,
        );
        continue;
      }

      if (!canSend("WHALE", symbol, WHALE_COOLDOWN_MS)) continue;

      recordWhaleSignal(symbol);

      const candles1h = binanceEngine.getCandles1h(symbol);
      const rsiValue = calcRSI(candles1h, 14);
      const ema200Trend = getEMA200Trend(candles1h);
      const macdSignal = getMACDSignal(candles1h);
      const haCandle =
        candles1h.length > 0
          ? getHeikinAshiCandle(candles1h[candles1h.length - 1])
          : "N/A";

      const lastAlertTime = getLastAlertTime("WHALE", symbol);
      const lastAlertAgo = formatTimeAgo(lastAlertTime);
      setLastAlertTime("WHALE", symbol);

      const messageData = {
        symbol,
        side: whaleData.side,
        side_emoji: whaleData.side_emoji,
        volume_usdt: whaleData.volume_usdt,
        volume_token: whaleData.volume_usdt / (ticker.lastPrice || 1),
        base: symbol,
        baseline_window: whaleData.baseline_window,
        volume_ratio: whaleData.volume_ratio,
        price_usdt: ticker.lastPrice || 0,
        change_24h: (ticker.priceChange || 0).toFixed(2),
        volume_24h_usdt: ticker.volume || 0,
        ema200_trend: ema200Trend,
        rsi_value: rsiValue,
        macd_signal: macdSignal,
        ha_candle: haCandle,
        last_alert_ago: lastAlertAgo,
      };

      const message = templates.whaleSignal(messageData);

      try {
        const chartPath = await generatePythonChart(symbol);
        if (chartPath) {
          await bot.telegram.sendPhoto(
            CHANNEL_ID,
            { source: chartPath },
            { caption: message },
          );
          fs.unlinkSync(chartPath);
        } else {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        }
        console.log(
          `✅ [WHALE] ${symbol} 고래 ${whaleData.side} 시그널 전송`,
        );
      } catch (sendErr) {
        console.error(
          `[WHALE] ${symbol} 전송 실패:`,
          sendErr.message,
        );
        try {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        } catch (fallbackErr) {
          console.error(
            `[WHALE] ${symbol} 텍스트 전송도 실패:`,
            fallbackErr.message,
          );
        }
      }
    }
  } catch (err) {
    console.error("[WHALE Signal] Error:", err.message);
  }
}

async function runAllFreeSignals(bot) {
  await runKimpSignals(bot);
  await runWhaleSignals(bot);
}

function initializeSymbolUpdater() {
  startAutoUpdate();
}

module.exports = {
  runKimpSignals,
  runWhaleSignals,
  runAllFreeSignals,
  initializeSymbolUpdater,
};
