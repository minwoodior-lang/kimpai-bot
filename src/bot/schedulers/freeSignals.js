const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { canSend, getLastAlertTime, setLastAlertTime, formatTimeAgo } = require("../state/freeScanLock");
const templates = require("../utils/freeSignalTemplates");
const { calcRSI, getEMA200TrendV2, detectMACDCrossover, isHeikinAshiBull, calcMACD } = require("../../lib/indicators/ta");
const binanceEngine = require("../../workers/binanceSignalEngine");
const { getTopSymbols, startAutoUpdate, getSymbolsWithoutSuffix } = require("../utils/binanceSymbols");
const localData = require("../utils/localData");

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// ============================================================
// KIMP 신호 설정 (v2.5)
// ============================================================
const KIMP_TYPE1_PREMIUM_MIN = 2.0;           // 급변: |김프| >= 2.0%
const KIMP_TYPE1_DIFF_5M = 0.5;               // 급변: |Δ5m| >= 0.5%p
const KIMP_TYPE1_DIFF_15M = 0.8;              // 급변: |Δ15m| >= 0.8%p
const KIMP_TYPE1_COOLDOWN_MS = 30 * 60 * 1000; // 30분
const KIMP_MAX_PER_HOUR = 6;                  // 1시간 최대 6개

const KIMP_TYPE2_PREMIUM_MIN = 1.0;           // 역전: |김프| >= 1.0%
const KIMP_TYPE2_DIFF_30M = 1.5;              // 역전: |Δ30m| >= 1.5%p
const KIMP_TYPE2_COOLDOWN_MS = 60 * 60 * 1000; // 1시간

// ============================================================
// WHALE 신호 설정 (v2.5)
// ============================================================
const WHALE_COOLDOWN_MS = 45 * 60 * 1000;     // 45분
const WHALE_AMOUNT_HIGH = 8000;               // 8000 USDT
const WHALE_AMOUNT_LOW = 4000;                // 4000 USDT
const WHALE_VOLUME_MULTIPLE = 5;              // 5배
const WHALE_MIN_24H_VOLUME = 500000;          // 500k USDT

// 스팸 방지
const MAX_SIGNALS_PER_MINUTE = 3;
const MAX_SIGNALS_PER_10MIN = 3;
const MAX_SIGNALS_PER_HOUR = 12;

const kimpHistory = new Map();
const minuteSignalLog = new Map();
const signalTimestamps = [];

// ============================================================
// KIMP 프리미엄 히스토리
// ============================================================
function recordKimpHistory(symbol, premium) {
  if (!kimpHistory.has(symbol)) {
    kimpHistory.set(symbol, []);
  }
  const history = kimpHistory.get(symbol);
  history.push({ time: Date.now(), premium });
  
  // 30분 이상 오래된 데이터 제거
  const cutoff = Date.now() - 30 * 60 * 1000;
  while (history.length > 0 && history[0].time < cutoff) {
    history.shift();
  }
}

function getPremiumXminAgo(symbol, minutes) {
  const history = kimpHistory.get(symbol);
  if (!history || history.length === 0) return null;
  
  const targetTime = Date.now() - minutes * 60 * 1000;
  
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].time <= targetTime) {
      return history[i].premium;
    }
  }
  
  return null;
}

// ============================================================
// WHALE 스팸 방지
// ============================================================
function getOrCreateMinuteLog() {
  const now = Math.floor(Date.now() / 60000) * 60000;
  const key = `minute:${now}`;
  
  if (!minuteSignalLog.has(key)) {
    minuteSignalLog.set(key, []);
    
    const cutoff = now - 5 * 60000;
    for (const [k] of minuteSignalLog) {
      if (k.startsWith('minute:')) {
        const time = parseInt(k.split(':')[1]);
        if (time < cutoff) {
          minuteSignalLog.delete(k);
        }
      }
    }
  }
  
  return minuteSignalLog.get(key);
}

function canSendWhaleSignal(symbol) {
  const now = Date.now();
  
  // 1분 내 3개 초과 확인
  const minuteLog = getOrCreateMinuteLog();
  if (minuteLog.length >= MAX_SIGNALS_PER_MINUTE) return false;
  
  // 10분 내 3개 초과 확인
  const last10min = signalTimestamps.filter(t => now - t < 10 * 60000);
  if (last10min.length >= MAX_SIGNALS_PER_10MIN) return false;
  
  // 1시간 내 12개 초과 확인
  const lastHour = signalTimestamps.filter(t => now - t < 60 * 60000);
  if (lastHour.length >= MAX_SIGNALS_PER_HOUR) return false;
  
  return true;
}

function recordWhaleSignal(symbol) {
  const minuteLog = getOrCreateMinuteLog();
  minuteLog.push(symbol);
  signalTimestamps.push(Date.now());
  
  // 2시간 이상 된 것 제거
  const cutoff = Date.now() - 2 * 60 * 60000;
  while (signalTimestamps.length > 0 && signalTimestamps[0] < cutoff) {
    signalTimestamps.shift();
  }
}

// ============================================================
// KIMP 신호 (v2.5)
// ============================================================
async function runKimpSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const data = localData.getPremiumFiltered("UPBIT", "KRW", "BINANCE", "USDT");
    if (!data || !Array.isArray(data) || data.length === 0) return;

    for (const symbol of ['BTC', 'ETH']) {
      const coin = data.find(c => c.symbol === symbol);
      if (!coin) continue;

      const premiumNow = parseFloat(coin.premium || 0);
      recordKimpHistory(symbol, premiumNow);
      
      const premiumAbs = Math.abs(premiumNow);
      
      // ==========================================
      // 타입1: 김프 급변 (급격한 변화)
      // ==========================================
      const premium5mAgo = getPremiumXminAgo(symbol, 5);
      const premium15mAgo = getPremiumXminAgo(symbol, 15);
      
      let sendType1 = false;
      let diffValue = 0;
      
      if (premium5mAgo !== null) {
        const diff5m = Math.abs(premiumNow - premium5mAgo);
        if (premiumAbs >= KIMP_TYPE1_PREMIUM_MIN && diff5m >= KIMP_TYPE1_DIFF_5M) {
          sendType1 = true;
          diffValue = premiumNow - premium5mAgo;
        }
      }
      
      if (!sendType1 && premium15mAgo !== null) {
        const diff15m = Math.abs(premiumNow - premium15mAgo);
        if (premiumAbs >= KIMP_TYPE1_PREMIUM_MIN && diff15m >= KIMP_TYPE1_DIFF_15M) {
          sendType1 = true;
          diffValue = premiumNow - premium15mAgo;
        }
      }
      
      if (sendType1 && canSend('KIMP_T1', symbol, KIMP_TYPE1_COOLDOWN_MS)) {
        // 1시간 내 6개 제한 확인
        const hourRecord = getKimpHourRecord();
        if (hourRecord.count < KIMP_MAX_PER_HOUR) {
          const messageData = {
            symbol,
            price_krw: coin.domesticPrice || coin.korean_price || 0,
            price_usd: coin.foreignPrice || coin.global_price || 0,
            premium_now: premiumNow.toFixed(2),
            premium_prev: (premiumNow - diffValue).toFixed(2),
            premium_diff: diffValue.toFixed(2),
            type: "급변"
          };

          const message = templates.kimpSignal(messageData);
          
          try {
            const chartPath = await generatePythonChart(symbol);
            if (chartPath) {
              await bot.telegram.sendPhoto(CHANNEL_ID, { source: chartPath }, { caption: message });
              fs.unlinkSync(chartPath);
            } else {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
            }
            console.log(`✅ [KIMP_T1] ${symbol} 김프 급변 시그널 전송`);
            addKimpHourRecord();
          } catch (sendErr) {
            console.error(`[KIMP_T1] ${symbol} 전송 실패:`, sendErr.message);
            try {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
              addKimpHourRecord();
            } catch (fallbackErr) {
              console.error(`[KIMP_T1] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
            }
          }
        }
      }
      
      // ==========================================
      // 타입2: 김프 방향 역전 (부호 반전)
      // ==========================================
      const premium30mAgo = getPremiumXminAgo(symbol, 30);
      
      if (premium30mAgo !== null) {
        const isBullish = premiumNow > 0;
        const wasBullish = premium30mAgo > 0;
        
        if (isBullish !== wasBullish) {
          // 부호가 반대
          const diff30m = Math.abs(premiumNow - premium30mAgo);
          if (premiumAbs >= KIMP_TYPE2_PREMIUM_MIN && diff30m >= KIMP_TYPE2_DIFF_30M) {
            if (canSend('KIMP_T2', symbol, KIMP_TYPE2_COOLDOWN_MS)) {
              const messageData = {
                symbol,
                price_krw: coin.domesticPrice || coin.korean_price || 0,
                price_usd: coin.foreignPrice || coin.global_price || 0,
                premium_now: premiumNow.toFixed(2),
                premium_prev: premium30mAgo.toFixed(2),
                premium_diff: (premiumNow - premium30mAgo).toFixed(2),
                type: "역전"
              };

              const message = templates.kimpSignal(messageData);
              
              try {
                const chartPath = await generatePythonChart(symbol);
                if (chartPath) {
                  await bot.telegram.sendPhoto(CHANNEL_ID, { source: chartPath }, { caption: message });
                  fs.unlinkSync(chartPath);
                } else {
                  await bot.telegram.sendMessage(CHANNEL_ID, message);
                }
                console.log(`✅ [KIMP_T2] ${symbol} 김프 역전 시그널 전송`);
              } catch (sendErr) {
                console.error(`[KIMP_T2] ${symbol} 전송 실패:`, sendErr.message);
                try {
                  await bot.telegram.sendMessage(CHANNEL_ID, message);
                } catch (fallbackErr) {
                  console.error(`[KIMP_T2] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[KIMP Signal] Error:", err.message);
  }
}

// ============================================================
// WHALE 신호 (v2.5)
// ============================================================
async function runWhaleSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const topSymbols = await getTopSymbols();
    const symbolsWithoutSuffix = topSymbols.map(s => s.replace('USDT', ''));

    for (const symbol of symbolsWithoutSuffix) {
      // 1단계: 스팸 방지 확인
      if (!canSendWhaleSignal(symbol)) {
        console.log(`⏭️ [WHALE] ${symbol}: 1분 내 시그널 3개 초과 (폭주 방지)`);
        continue;
      }

      // 2단계: 고래 조건 확인
      const whaleData = binanceEngine.checkWhaleCondition(symbol);
      if (!whaleData) continue;
      
      // 3단계: 심볼별 쿨다운 확인
      if (!canSend('WHALE', symbol, WHALE_COOLDOWN_MS)) continue;
      
      // 4단계: 1시간 추세 필터 (극강화: SIDEWAYS 절대 차단)
      const candles1h = binanceEngine.getCandles1h(symbol);
      if (!candles1h || candles1h.length === 0) continue;
      
      const { trend, slope } = getEMA200TrendV2(candles1h);
      
      // SIDEWAYS는 절대 발송 금지 (극강화 필터 적용)
      if (trend === "SIDEWAYS") {
        console.log(`⏭️ [WHALE] ${symbol}: SIDEWAYS 추세 감지 (slope=${slope.toFixed(6)}) → 발송 금지 ✗`);
        continue;
      }
      
      console.log(`✅ [WHALE] ${symbol}: 추세 인정 (trend=${trend}, slope=${slope.toFixed(6)})`);

      
      // 5단계: 체결 필터 (공통)
      const ticker = binanceEngine.get24hData(`${symbol}USDT`);
      if (!ticker || !ticker.volume || ticker.volume < WHALE_MIN_24H_VOLUME) {
        console.log(`⏭️ [WHALE] ${symbol}: 24h 거래액 부족 (${ticker?.volume || 0} < ${WHALE_MIN_24H_VOLUME})`);
        continue;
      }
      
      const amountUsdt = whaleData.volume_usdt || 0;
      const volume20mMultiple = whaleData.volume_ratio || 1;
      
      const passesVolumeFilter = 
        (amountUsdt >= WHALE_AMOUNT_HIGH) ||
        (amountUsdt >= WHALE_AMOUNT_LOW && volume20mMultiple >= WHALE_VOLUME_MULTIPLE);
      
      if (!passesVolumeFilter) {
        console.log(`⏭️ [WHALE] ${symbol}: 체결 필터 미충족`);
        continue;
      }
      
      // 6단계: 기술 지표 수집
      const rsiValue = calcRSI(candles1h, 14);
      const { hasGolden, hasDead } = detectMACDCrossover(candles1h);
      const isBullHA = isHeikinAshiBull(candles1h[candles1h.length - 1]);
      
      // 7단계: BUY 신호 (trend = UP)
      if (trend === "UP") {
        let bullishCount = 0;
        if (isBullHA) bullishCount++;
        if (hasGolden) bullishCount++;
        if (rsiValue !== null && rsiValue >= 55) bullishCount++;
        
        // 3개 중 2개 이상 & 순매수
        if (bullishCount >= 2 && whaleData.volume_usdt > 0) {
          recordWhaleSignal(symbol);
          setLastAlertTime('WHALE', symbol);

          const messageData = {
            symbol,
            side: "매수",
            side_emoji: "🟢",
            volume_usdt: whaleData.volume_usdt,
            volume_token: whaleData.volume_usdt / (ticker.lastPrice || 1),
            base: symbol,
            baseline_window: whaleData.baseline_window,
            volume_ratio: whaleData.volume_ratio,
            price_usdt: ticker.lastPrice || 0,
            change_24h: (ticker.priceChange || 0).toFixed(2),
            volume_24h_usdt: ticker.volume || 0,
            ema200_trend: trend,
            rsi_value: rsiValue,
            macd_signal: hasGolden ? "골든크로스🟢" : "중립⚪",
            ha_candle: isBullHA ? "양봉🟢" : "음봉🔴",
            last_alert_ago: formatTimeAgo(getLastAlertTime('WHALE', symbol))
          };

          const message = templates.whaleSignal(messageData);

          try {
            const chartPath = await generatePythonChart(symbol);
            if (chartPath) {
              await bot.telegram.sendPhoto(CHANNEL_ID, { source: chartPath }, { caption: message });
              fs.unlinkSync(chartPath);
            } else {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
            }
            console.log(`✅ [WHALE_BUY] ${symbol} 고래 매수 시그널 전송`);
          } catch (sendErr) {
            console.error(`[WHALE_BUY] ${symbol} 전송 실패:`, sendErr.message);
            try {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
            } catch (fallbackErr) {
              console.error(`[WHALE_BUY] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
            }
          }
        }
      }
      
      // 8단계: SELL 신호 (trend = DOWN)
      else if (trend === "DOWN") {
        let bearishCount = 0;
        if (!isBullHA) bearishCount++;
        if (hasDead) bearishCount++;
        if (rsiValue !== null && rsiValue <= 45) bearishCount++;
        
        // 3개 중 2개 이상 & 순매도
        if (bearishCount >= 2 && whaleData.volume_usdt < 0) {
          recordWhaleSignal(symbol);
          setLastAlertTime('WHALE', symbol);

          const messageData = {
            symbol,
            side: "매도",
            side_emoji: "🔴",
            volume_usdt: Math.abs(whaleData.volume_usdt),
            volume_token: Math.abs(whaleData.volume_usdt) / (ticker.lastPrice || 1),
            base: symbol,
            baseline_window: whaleData.baseline_window,
            volume_ratio: whaleData.volume_ratio,
            price_usdt: ticker.lastPrice || 0,
            change_24h: (ticker.priceChange || 0).toFixed(2),
            volume_24h_usdt: ticker.volume || 0,
            ema200_trend: trend,
            rsi_value: rsiValue,
            macd_signal: hasDead ? "데드크로스🔴" : "중립⚪",
            ha_candle: isBullHA ? "양봉🟢" : "음봉🔴",
            last_alert_ago: formatTimeAgo(getLastAlertTime('WHALE', symbol))
          };

          const message = templates.whaleSignal(messageData);

          try {
            const chartPath = await generatePythonChart(symbol);
            if (chartPath) {
              await bot.telegram.sendPhoto(CHANNEL_ID, { source: chartPath }, { caption: message });
              fs.unlinkSync(chartPath);
            } else {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
            }
            console.log(`✅ [WHALE_SELL] ${symbol} 고래 매도 시그널 전송`);
          } catch (sendErr) {
            console.error(`[WHALE_SELL] ${symbol} 전송 실패:`, sendErr.message);
            try {
              await bot.telegram.sendMessage(CHANNEL_ID, message);
            } catch (fallbackErr) {
              console.error(`[WHALE_SELL] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[WHALE Signal] Error:", err.message);
  }
}

// ============================================================
// 차트 생성
// ============================================================
async function generatePythonChart(symbol) {
  const scriptPath = path.join(__dirname, "../../chart/priceChart.py");
  
  if (!fs.existsSync(scriptPath)) {
    console.warn("[Chart] Python script not found");
    return null;
  }
  
  try {
    const result = execSync(`python ${scriptPath} ${symbol}USDT 5m`, {
      encoding: "utf-8",
      timeout: 30000,
      cwd: process.cwd()
    });
    
    const chartPath = result.trim();
    
    if (chartPath && fs.existsSync(chartPath)) {
      console.log(`[Chart] Generated: ${chartPath}`);
      return chartPath;
    }
    
    return null;
  } catch (err) {
    console.error(`[Chart] Generation failed for ${symbol}:`, err.message);
    return null;
  }
}

// ============================================================
// KIMP 1시간 기록 (1시간 6개 제한)
// ============================================================
let kimpHourRecord = { startTime: Date.now(), count: 0 };

function getKimpHourRecord() {
  const now = Date.now();
  if (now - kimpHourRecord.startTime > 60 * 60 * 1000) {
    kimpHourRecord = { startTime: now, count: 0 };
  }
  return kimpHourRecord;
}

function addKimpHourRecord() {
  kimpHourRecord.count++;
}

// ============================================================
// 메인 함수
// ============================================================
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
  initializeSymbolUpdater
};
