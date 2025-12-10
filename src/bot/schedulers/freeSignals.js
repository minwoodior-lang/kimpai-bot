const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { canSend, getLastAlertTime, setLastAlertTime, formatTimeAgo } = require("../state/freeScanLock");
const templates = require("../utils/freeSignalTemplates");
const { calcRSI, getEMA200Trend, getMACDSignal, getHeikinAshiCandle } = require("../../lib/indicators/ta");
const binanceEngine = require("../../workers/binanceSignalEngine");
const { getTopSymbols, startAutoUpdate, getSymbolsWithoutSuffix } = require("../utils/binanceSymbols");

const API_BASE = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000";
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
  
  // 오래된 타임스탬프 정리 (2시간 이상 된 것 제거)
  const cutoff = Date.now() - 2 * 60 * 60000;
  while (signalTimestamps.length > 0 && signalTimestamps[0] < cutoff) {
    signalTimestamps.shift();
  }
}

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

async function runKimpSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const response = await axios.get(`${API_BASE}/api/premium/table-filtered`, {
      params: { domestic: 'UPBIT_KRW', foreign: 'BINANCE_USDT' },
      timeout: 10000
    });
    
    const data = response.data;
    if (!data || !Array.isArray(data)) return;

    for (const symbol of ['BTC', 'ETH']) {
      const coin = data.find(c => c.symbol === symbol);
      if (!coin) continue;

      const premiumNow = parseFloat(coin.premium || 0);
      recordKimpHistory(symbol, premiumNow);
      
      const premiumPrev = getPremium5minAgo(symbol);
      if (premiumPrev === null) continue;
      
      const diff = premiumNow - premiumPrev;
      
      const shouldTrigger = 
        Math.abs(diff) >= KIMP_DIFF_THRESHOLD ||
        premiumNow >= KIMP_ABSOLUTE_THRESHOLD ||
        premiumNow <= -KIMP_ABSOLUTE_THRESHOLD;

      if (!shouldTrigger) continue;
      if (!canSend('KIMP', symbol, KIMP_COOLDOWN_MS)) continue;

      const messageData = {
        symbol,
        price_krw: coin.domesticPrice || coin.korean_price || 0,
        price_usd: coin.foreignPrice || coin.global_price || 0,
        premium_now: premiumNow.toFixed(2),
        premium_prev: premiumPrev.toFixed(2),
        premium_diff: diff.toFixed(2)
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
        console.log(`✅ [KIMP] ${symbol} 김프 급변 시그널 전송 (${diff.toFixed(2)}%p)`);
      } catch (sendErr) {
        console.error(`[KIMP] ${symbol} 전송 실패:`, sendErr.message);
        try {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        } catch (fallbackErr) {
          console.error(`[KIMP] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
        }
      }
    }
  } catch (err) {
    console.error("[KIMP Signal] Error:", err.message);
  }
}

async function runWhaleSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const topSymbols = await getTopSymbols();
    const symbolsWithoutSuffix = topSymbols.map(s => s.replace('USDT', ''));

    for (const symbol of symbolsWithoutSuffix) {
      if (!canSendWhaleSignal(symbol)) {
        console.log(`⏭️ [WHALE] ${symbol}: 1분 내 시그널 3개 초과 (폭주 방지)`);
        continue;
      }

      const whaleData = binanceEngine.checkWhaleCondition(symbol);
      if (!whaleData) continue;
      
      if (!canSend('WHALE', symbol, WHALE_COOLDOWN_MS)) continue;
      
      recordWhaleSignal(symbol);

      const ticker = binanceEngine.get24hData(`${symbol}USDT`);
      const candles1h = binanceEngine.getCandles1h(symbol);
      
      const rsiValue = calcRSI(candles1h, 14);
      const ema200Trend = getEMA200Trend(candles1h);
      const macdSignal = getMACDSignal(candles1h);
      const haCandle = candles1h.length > 0 
        ? getHeikinAshiCandle(candles1h[candles1h.length - 1]) 
        : "N/A";

      const lastAlertTime = getLastAlertTime('WHALE', symbol);
      const lastAlertAgo = formatTimeAgo(lastAlertTime);
      setLastAlertTime('WHALE', symbol);

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
        last_alert_ago: lastAlertAgo
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
        console.log(`✅ [WHALE] ${symbol} 고래 ${whaleData.side} 시그널 전송`);
      } catch (sendErr) {
        console.error(`[WHALE] ${symbol} 전송 실패:`, sendErr.message);
        try {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        } catch (fallbackErr) {
          console.error(`[WHALE] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
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
  initializeSymbolUpdater
};
