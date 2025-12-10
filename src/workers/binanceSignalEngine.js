const WebSocket = require('ws');
const axios = require('axios');
const { getTopSymbols, FALLBACK_SYMBOLS } = require('../bot/utils/binanceSymbols');

const BASELINE_WINDOW = 20;

// FREE 고래 시그널 v2.4 필터 상수
const MAJOR_COINS = ['BTC', 'ETH', 'BNB', 'SOL'];
const MIN_24H_VOLUME_USDT = 5000000; // 24h 거래액 하한 ≥ 5M USDT

// 일반 코인
const MIN_VOLUME_USDT = 10000;
const WHALE_VOLUME_RATIO = 5.0;

// 메이저 코인
const MAJOR_MIN_VOLUME_USDT = 50000;
const MAJOR_WHALE_VOLUME_RATIO = 4.0;

// EMA 상수
const EMA_PERIOD = 200;
const EMA_SLOPE_WINDOW = 5;
const EMA_SLOPE_THRESHOLD = 0.0001;

// ⚠️ Regional Restriction 감지 헬퍼 (451 대응)
function isRegionalRestrictionError(err) {
  const msg = String(err && (err.message || err));
  return msg.includes('451') || msg.toLowerCase().includes('regional restriction');
}

// 전역 상태 저장소
const GLOBAL_STATE_KEY = '__binanceSignalState__';
if (!global[GLOBAL_STATE_KEY]) {
  global[GLOBAL_STATE_KEY] = {
    lastUpdateTime: Date.now(),
    lastTradeTime: 0,
    recentTradeCount: 0,
    lastErrorMessage: null,
    engineErrors: [],
    restartCount: 0,
    lastRestartTime: 0,
    isRunning: false,
    wsConnected: false,
    klineWsConnected: false
  };
}
const globalState = global[GLOBAL_STATE_KEY];

let lastUpdateTime = globalState.lastUpdateTime;
let lastTradeTime = globalState.lastTradeTime;
let recentTradeCount = globalState.recentTradeCount;
let lastErrorMessage = globalState.lastErrorMessage;
let engineErrors = globalState.engineErrors;
let restartCount = globalState.restartCount;
let lastRestartTime = globalState.lastRestartTime;

// WebSocket 헬스 상수
const WS_PING_INTERVAL = 30000;
const WS_PONG_TIMEOUT = 10000;
const TRADE_STALE_THRESHOLD = 90000;
const MAX_RESTART_INTERVAL = 300000;

const SPIKE_PRICE_THRESHOLD = 2;
const SPIKE_VOLUME_RATIO = 3;

const tradeBuckets = new Map();
const baselineVolumes = new Map();
const candles1m = new Map();
const candles1h = new Map();
const ticker24h = new Map();

let ws = null;
let klineWs = null;
let isRunning = false;
let wsPingInterval = null;
let klineWsPingInterval = null;
let pendingPong = false;
let pendingKlinePong = false;

// 상태 동기화
function syncGlobalState() {
  globalState.lastUpdateTime = lastUpdateTime;
  globalState.lastTradeTime = lastTradeTime;
  globalState.recentTradeCount = recentTradeCount;
  globalState.lastErrorMessage = lastErrorMessage;
  globalState.engineErrors = engineErrors;
  globalState.restartCount = restartCount;
  globalState.lastRestartTime = lastRestartTime;
  globalState.isRunning = isRunning;
  globalState.wsConnected = ws && ws.readyState === WebSocket.OPEN;
  globalState.klineWsConnected = klineWs && klineWs.readyState === WebSocket.OPEN;
  globalState.tradeBucketCount = tradeBuckets.size;
  globalState.baselineCount = baselineVolumes.size;
}

function floorToMinute(ts) {
  return Math.floor(ts / 60000) * 60000;
}

function getBucket(symbol, ts) {
  const win = floorToMinute(ts);
  const key = `${symbol}:${win}`;
  if (!tradeBuckets.has(key)) {
    tradeBuckets.set(key, { windowStart: win, buyNotional: 0, sellNotional: 0, symbol });
  }
  return tradeBuckets.get(key);
}

function cleanOldBuckets() {
  const cutoff = Date.now() - (BASELINE_WINDOW + 5) * 60000;
  for (const [key, bucket] of tradeBuckets.entries()) {
    if (bucket.windowStart < cutoff) tradeBuckets.delete(key);
  }
}

function updateBaseline(symbol) {
  const now = Date.now();
  const arr = [];
  for (let i = 2; i <= BASELINE_WINDOW + 1; i++) {
    const win = floorToMinute(now - i * 60000);
    const key = `${symbol}:${win}`;
    const b = tradeBuckets.get(key);
    if (b) arr.push(b.buyNotional + b.sellNotional);
  }
  if (arr.length >= 5) {
    baselineVolumes.set(symbol, arr.reduce((a, b) => a + b, 0) / arr.length);
  }
}

function getLastMinuteBucket(symbol) {
  const ts = floorToMinute(Date.now() - 60000);
  return tradeBuckets.get(`${symbol}:${ts}`);
}

// 200EMA 계산
function calculateEMA(candles, period = EMA_PERIOD) {
  if (!candles || candles.length < period) return [];
  const closes = candles.map(c => parseFloat(c.close));
  const multiplier = 2 / (period + 1);
  const ema = [];

  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  ema.push(sum / period);

  for (let i = period; i < closes.length; i++) {
    const v = (closes[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(v);
  }
  return ema;
}

function calculateEMASlope(ema, window = EMA_SLOPE_WINDOW) {
  if (!ema || ema.length < window) return 0;
  const recent = ema.slice(-window);
  return (recent[recent.length - 1] - recent[0]) / recent[0];
}

function getEMA200TrendStatus(symbol) {
  const base = symbol.toUpperCase().replace('USDT', '');
  const arr = candles1h.get(base);
  if (!arr || arr.length < EMA_PERIOD) return 'flat';

  const ema = calculateEMA(arr, EMA_PERIOD);
  if (ema.length === 0) return 'flat';

  const currentEMA = ema[ema.length - 1];
  const close = parseFloat(arr[arr.length - 1].close);
  const slope = calculateEMASlope(ema);

  if (Math.abs(slope) < EMA_SLOPE_THRESHOLD) return 'flat';
  if (close > currentEMA && slope > 0) return 'up';
  if (close < currentEMA && slope < 0) return 'down';
  return 'flat';
}

function checkTrendFilter(symbol, side) {
  const t = getEMA200TrendStatus(symbol);
  if (t === 'flat') return false;
  if (side === 'buy' && t === 'up') return true;
  if (side === 'sell' && t === 'down') return true;
  return false;
}

function checkWhaleCondition(symbol) {
  const full = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : symbol.toUpperCase() + 'USDT';
  const base = full.replace('USDT', '');
  const bucket = getLastMinuteBucket(full);
  if (!bucket) return null;

  const baseline = baselineVolumes.get(full);
  if (!baseline || baseline < 100) return null;

  const t = ticker24h.get(full);
  if (t && (t.volume || 0) < MIN_24H_VOLUME_USDT) return null;

  const vol = bucket.buyNotional + bucket.sellNotional;
  const isMajor = MAJOR_COINS.includes(base);
  const minVolume = isMajor ? MAJOR_MIN_VOLUME_USDT : MIN_VOLUME_USDT;
  const minRatio = isMajor ? MAJOR_WHALE_VOLUME_RATIO : WHALE_VOLUME_RATIO;

  if (vol < minVolume) return null;
  const ratio = vol / baseline;
  if (ratio < minRatio) return null;

  const buyRatio = bucket.buyNotional / vol;
  const sellRatio = bucket.sellNotional / vol;

  if (buyRatio >= 0.65) {
    if (!checkTrendFilter(base, 'buy')) return null;
    return {
      symbol: base,
      side: '매수',
      side_emoji: '🟢',
      volume_usdt: vol,
      buy_notional: bucket.buyNotional,
      sell_notional: bucket.sellNotional,
      volume_ratio: ratio,
      baseline_window: BASELINE_WINDOW,
      trend_filter: 'bullish'
    };
  }

  if (sellRatio >= 0.65) {
    if (!checkTrendFilter(base, 'sell')) return null;
    return {
      symbol: base,
      side: '매도',
      side_emoji: '🔴',
      volume_usdt: vol,
      buy_notional: bucket.buyNotional,
      sell_notional: bucket.sellNotional,
      volume_ratio: ratio,
      baseline_window: BASELINE_WINDOW,
      trend_filter: 'bearish'
    };
  }

  return null;
}

function checkSpikeCondition(symbol) {
  const full = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : symbol.toUpperCase() + 'USDT';
  const base = symbol.toUpperCase().replace('USDT', '');
  let candles = candles1m.get(full);
  if (!candles || candles.length < 21) {
    candles = candles1m.get(base);
    if (!candles || candles.length < 21) return null;
  }

  const prev = candles[candles.length - 2];
  const curr = candles[candles.length - 1];
  if (!prev || !curr) return null;

  const prevClose = parseFloat(prev.close);
  const currClose = parseFloat(curr.close);
  const pct = ((currClose - prevClose) / prevClose) * 100;

  const vols = candles.slice(-21, -1).map(c => parseFloat(c.volume));
  const avg = vols.reduce((a, b) => a + b, 0) / vols.length;
  const vRatio = parseFloat(curr.volume) / avg;

  if (Math.abs(pct) >= SPIKE_PRICE_THRESHOLD && vRatio >= SPIKE_VOLUME_RATIO) {
    return {
      symbol: base,
      type: pct > 0 ? 'up' : 'down',
      price_change_1m: pct,
      price_usdt: currClose,
      volume_ratio: vRatio,
      baseline_window: 20
    };
  }
  return null;
}

async function fetchAllUsdtSymbols() {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    return res.data.symbols
      .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map(s => s.symbol.toLowerCase());
  } catch (err) {
    console.error('[BinanceSignal] Failed to fetch symbols:', err.message);
    return [];
  }
}

async function fetch24hTicker() {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    for (const t of res.data) {
      if (t.symbol.endsWith('USDT')) {
        ticker24h.set(t.symbol, {
          priceChange: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
          lastPrice: parseFloat(t.lastPrice)
        });
      }
    }
    lastUpdateTime = Date.now();
    console.log(`[BinanceSignal] Updated 24h ticker for ${ticker24h.size} symbols`);
  } catch (err) {
    console.error('[BinanceSignal] Failed to fetch 24h ticker:', err.message);
  }
}

async function fetchKlines(symbol, interval = '1h', limit = 250) {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: symbol.toUpperCase(), interval, limit }
    });
    return res.data.map(k => ({
      openTime: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
      closeTime: k[6]
    }));
  } catch (err) {
    console.error(`[BinanceSignal] Failed to fetch klines for ${symbol}:`, err.message);
    return [];
  }
}

function get24hData(symbol) {
  return ticker24h.get(symbol.toUpperCase()) || { priceChange: 0, volume: 0, lastPrice: 0 };
}

function getCandles1h(symbol) {
  const base = symbol.toUpperCase().replace('USDT', '');
  return candles1h.get(base) || [];
}

// ------------------------------------------------------------
// WebSocket 정리 함수
// ------------------------------------------------------------
function closeWebSocket(socket, pingInterval) {
  try {
    if (pingInterval) clearInterval(pingInterval);
    if (!socket) return;

    const noop = () => {};
    socket.removeAllListeners('error');
    socket.on('error', noop);

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      try {
        socket.close();
      } catch (e) {
        console.error('[BinanceSignal] WS close error:', e.message || e);
      }
    }

    socket.removeAllListeners('open');
    socket.removeAllListeners('message');
    socket.removeAllListeners('close');
    socket.removeAllListeners('pong');
  } catch (err) {
    console.error('[BinanceSignal] closeWebSocket outer error:', err.message || err);
  }
}

// ============================================================
// 🚨 AggTrade WebSocket (451 무한재접속 차단 포함 패치됨)
// ============================================================
function startAggTradeStream(symbols) {
  if (symbols.length === 0) return;

  closeWebSocket(ws, wsPingInterval);
  ws = null;
  wsPingInterval = null;
  pendingPong = false;

  const stream = symbols.slice(0, 200).map(s => `${s}@aggTrade`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${stream}`;

  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log(`[BinanceSignal] AggTrade WS connected (${Math.min(symbols.length, 200)} symbols)`);
    lastTradeTime = Date.now();
    syncGlobalState();

    wsPingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (pendingPong) {
          console.warn('[BinanceSignal] AggTrade WS pong timeout → reconnect');
          recordError('AggTrade WS pong timeout');
          closeWebSocket(ws, wsPingInterval);
          setTimeout(() => startAggTradeStream(currentSymbols.slice(0, 100)), 1000);
          return;
        }
        pendingPong = true;
        try {
          ws.ping();
        } catch (e) {
          console.error('[BinanceSignal] AggTrade WS ping error:', e.message || e);
          recordError('AggTrade WS ping error: ' + (e.message || e));
          closeWebSocket(ws, wsPingInterval);
          setTimeout(() => startAggTradeStream(currentSymbols.slice(0, 100)), 1000);
        }
      }
    }, WS_PING_INTERVAL);
  });

  ws.on('pong', () => (pendingPong = false));

  ws.on('message', data => {
    try {
      const msg = JSON.parse(data);
      const t = msg.data;
      if (!t) return;

      const symbol = t.s;
      const price = parseFloat(t.p);
      const qty = parseFloat(t.q);
      const notional = price * qty;
      const ts = t.T;

      const bucket = getBucket(symbol, ts);
      if (t.m) bucket.sellNotional += notional;
      else bucket.buyNotional += notional;

      lastTradeTime = Date.now();
      recentTradeCount++;
    } catch (e) {}
  });

  // ------------------------------------------------------------
  // 🚨 (패치됨) AggTrade error 핸들러 – 451 시 완전 중단
  // ------------------------------------------------------------
  ws.on('error', err => {
    const msg = err && (err.message || err);
    console.error('[BinanceSignal] AggTrade WS error:', msg);

    if (isRegionalRestrictionError(err)) {
      recordError('AggTrade WS regional restriction (451) - stop reconnecting');
      console.warn('🚫 Binance AggTrade Stream BLOCKED by region (451). No more reconnect.');
      closeWebSocket(ws, wsPingInterval);
      ws = null;
      wsPingInterval = null;
      return; // 재접속 중단
    }

    recordError('AggTrade WS error: ' + msg);
  });

  // ------------------------------------------------------------
  // 🚨 (패치됨) AggTrade close 핸들러 – 451 인 경우 재접속 금지
  // ------------------------------------------------------------
  ws.on('close', (code, reason) => {
    console.log(`[BinanceSignal] AggTrade WS disconnected (code: ${code})`);
    recordError(`AggTrade WS closed: ${code}`);

    closeWebSocket(ws, wsPingInterval);
    syncGlobalState();
    ws = null;
    wsPingInterval = null;

    // 마지막 에러가 451이면 재접속 완전 중단
    if (lastErrorMessage && lastErrorMessage.includes('regional restriction (451)')) {
      console.warn('🚫 AggTrade WS blocked by 451 → STOP reconnect loop.');
      return;
    }

    // 그 외에는 정상 재연결
    setTimeout(() => {
      if (isRunning) startAggTradeStream(currentSymbols.slice(0, 100));
    }, 3000);
  });
}
