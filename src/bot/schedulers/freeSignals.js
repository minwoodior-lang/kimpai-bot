const axios = require("axios");
const { canSend, getLastAlertTime, setLastAlertTime, formatTimeAgo } = require("../state/freeScanLock");
const templates = require("../utils/freeSignalTemplates");
const { calcRSI, getEMA200Trend, getMACDSignal, getHeikinAshiCandle, buildEmaSeries } = require("../../lib/indicators/ta");
const binanceEngine = require("../../workers/binanceSignalEngine");

let renderSignalChart = null;
try {
  renderSignalChart = require("../../lib/chart/renderSignalChart").renderSignalChart;
} catch (err) {
  console.warn("[FreeSignals] Chart rendering not available:", err.message);
}

const API_BASE = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000";
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const KIMP_COOLDOWN_MS = 10 * 60 * 1000;
const WHALE_COOLDOWN_MS = 30 * 60 * 1000;
const SPIKE_COOLDOWN_MS = 10 * 60 * 1000;

const KIMP_DIFF_THRESHOLD = 0.4;
const KIMP_ABSOLUTE_THRESHOLD = 1.0;

const kimpHistory = new Map();

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

      const koreanBias = diff > 0 ? "빠르게 상승" : "빠르게 하락";
      const flowDesc = diff > 0 ? "매수" : "매도";

      const messageData = {
        symbol,
        price_krw: coin.domesticPrice || coin.korean_price || 0,
        price_usd: coin.foreignPrice || coin.global_price || 0,
        premium_now: premiumNow.toFixed(2),
        premium_prev: premiumPrev.toFixed(2),
        premium_diff: diff.toFixed(2),
        change_24h: (coin.change24h || coin.change_24h || 0).toFixed(2),
        korean_bias: koreanBias,
        flow_desc: flowDesc
      };

      const message = templates.kimpSignal(messageData);
      await bot.telegram.sendMessage(CHANNEL_ID, message);
      console.log(`✅ [KIMP] ${symbol} 김프 급변 시그널 전송 (${diff.toFixed(2)}%p)`);
    }
  } catch (err) {
    console.error("[KIMP Signal] Error:", err.message);
  }
}

async function runWhaleSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const topSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 
                        'SHIB', 'DOT', 'LINK', 'MATIC', 'LTC', 'UNI', 'ATOM',
                        'XLM', 'NEAR', 'APT', 'ARB', 'OP'];

    for (const symbol of topSymbols) {
      const whaleData = binanceEngine.checkWhaleCondition(symbol);
      if (!whaleData) continue;
      
      if (!canSend('WHALE', symbol, WHALE_COOLDOWN_MS)) continue;

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
        if (renderSignalChart && candles1h.length >= 50) {
          const emaSeries = buildEmaSeries(candles1h, 50);
          const png = await renderSignalChart({
            symbol,
            candles: candles1h.slice(-100),
            ema200: emaSeries.slice(-100)
          });
          await bot.telegram.sendPhoto(CHANNEL_ID, { source: png }, { caption: message });
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

async function runSpikeSignals(bot) {
  if (!CHANNEL_ID) return;

  try {
    const topSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 
                        'SHIB', 'DOT', 'LINK', 'MATIC', 'LTC', 'UNI', 'ATOM',
                        'XLM', 'NEAR', 'APT', 'ARB', 'OP'];

    for (const symbol of topSymbols) {
      const whaleCheck = binanceEngine.checkWhaleCondition(symbol);
      if (whaleCheck) continue;
      
      const spikeData = binanceEngine.checkSpikeCondition(symbol);
      if (!spikeData) continue;
      
      if (!canSend('SPIKE', symbol, SPIKE_COOLDOWN_MS)) continue;

      const ticker = binanceEngine.get24hData(`${symbol}USDT`);
      const candles1h = binanceEngine.getCandles1h(symbol);
      
      const rsiValue = calcRSI(candles1h, 14);
      const ema200Trend = getEMA200Trend(candles1h);
      const macdSignal = getMACDSignal(candles1h);
      const haCandle = candles1h.length > 0 
        ? getHeikinAshiCandle(candles1h[candles1h.length - 1]) 
        : "N/A";

      const messageData = {
        symbol,
        price_usdt: spikeData.price_usdt,
        price_change_1m: spikeData.price_change_1m,
        change_24h: (ticker.priceChange || 0).toFixed(2),
        baseline_window: spikeData.baseline_window,
        volume_ratio: spikeData.volume_ratio,
        ema200_trend: ema200Trend,
        rsi_value: rsiValue,
        macd_signal: macdSignal,
        ha_candle: haCandle
      };

      const message = spikeData.type === 'up' 
        ? templates.spikeUpSignal(messageData)
        : templates.spikeDownSignal(messageData);

      try {
        if (renderSignalChart && candles1h.length >= 50) {
          const emaSeries = buildEmaSeries(candles1h, 50);
          const png = await renderSignalChart({
            symbol,
            candles: candles1h.slice(-100),
            ema200: emaSeries.slice(-100)
          });
          await bot.telegram.sendPhoto(CHANNEL_ID, { source: png }, { caption: message });
        } else {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        }
        console.log(`✅ [SPIKE] ${symbol} 스파이크 ${spikeData.type} 시그널 전송`);
      } catch (sendErr) {
        console.error(`[SPIKE] ${symbol} 전송 실패:`, sendErr.message);
        try {
          await bot.telegram.sendMessage(CHANNEL_ID, message);
        } catch (fallbackErr) {
          console.error(`[SPIKE] ${symbol} 텍스트 전송도 실패:`, fallbackErr.message);
        }
      }
    }
  } catch (err) {
    console.error("[SPIKE Signal] Error:", err.message);
  }
}

async function runAllFreeSignals(bot) {
  await runKimpSignals(bot);
  await runWhaleSignals(bot);
  await runSpikeSignals(bot);
}

module.exports = {
  runKimpSignals,
  runWhaleSignals,
  runSpikeSignals,
  runAllFreeSignals
};
