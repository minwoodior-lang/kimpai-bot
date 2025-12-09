const WebSocket = require('ws');
const axios = require('axios');
const { getTopSymbols, FALLBACK_SYMBOLS } = require('../bot/utils/binanceSymbols');

const BASELINE_WINDOW = 20;
const MIN_VOLUME_USDT = 10000;
const WHALE_VOLUME_RATIO = 4.5;
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

function floorToMinute(timestamp) {
  return Math.floor(timestamp / 60000) * 60000;
}

function getBucket(symbol, timestamp) {
  const windowStart = floorToMinute(timestamp);
  const key = `${symbol}:${windowStart}`;
  
  if (!tradeBuckets.has(key)) {
    tradeBuckets.set(key, {
      windowStart,
      buyNotional: 0,
      sellNotional: 0,
      symbol
    });
  }
  
  return tradeBuckets.get(key);
}

function cleanOldBuckets() {
  const cutoff = Date.now() - (BASELINE_WINDOW + 5) * 60000;
  for (const [key, bucket] of tradeBuckets.entries()) {
    if (bucket.windowStart < cutoff) {
      tradeBuckets.delete(key);
    }
  }
}

function updateBaseline(symbol) {
  const now = Date.now();
  const buckets = [];
  
  for (let i = 2; i <= BASELINE_WINDOW + 1; i++) {
    const windowStart = floorToMinute(now - i * 60000);
    const key = `${symbol}:${windowStart}`;
    const bucket = tradeBuckets.get(key);
    if (bucket) {
      buckets.push(bucket.buyNotional + bucket.sellNotional);
    }
  }
  
  if (buckets.length >= 5) {
    const avg = buckets.reduce((a, b) => a + b, 0) / buckets.length;
    baselineVolumes.set(symbol, avg);
  }
}

function getLastMinuteBucket(symbol) {
  const lastMinute = floorToMinute(Date.now() - 60000);
  const key = `${symbol}:${lastMinute}`;
  return tradeBuckets.get(key);
}

function checkWhaleCondition(symbol) {
  const fullSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
  
  const bucket = getLastMinuteBucket(fullSymbol);
  if (!bucket) return null;
  
  const baseline = baselineVolumes.get(fullSymbol);
  if (!baseline || baseline < 100) return null;
  
  const volume1m = bucket.buyNotional + bucket.sellNotional;
  if (volume1m < MIN_VOLUME_USDT) return null;
  
  const ratio = volume1m / baseline;
  if (ratio < WHALE_VOLUME_RATIO) return null;
  
  const buyRatio = bucket.buyNotional / volume1m;
  const sellRatio = bucket.sellNotional / volume1m;
  
  if (buyRatio >= 0.6) {
    return {
      symbol: symbol.toUpperCase().replace('USDT', ''),
      side: '매수',
      side_emoji: '🟢',
      volume_usdt: volume1m,
      buy_notional: bucket.buyNotional,
      sell_notional: bucket.sellNotional,
      volume_ratio: ratio,
      baseline_window: BASELINE_WINDOW
    };
  }
  
  if (sellRatio >= 0.6) {
    return {
      symbol: symbol.toUpperCase().replace('USDT', ''),
      side: '매도',
      side_emoji: '🔴',
      volume_usdt: volume1m,
      buy_notional: bucket.buyNotional,
      sell_notional: bucket.sellNotional,
      volume_ratio: ratio,
      baseline_window: BASELINE_WINDOW
    };
  }
  
  return null;
}

function checkSpikeCondition(symbol) {
  const fullSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
  const baseSymbol = symbol.toUpperCase().replace('USDT', '');
  
  let candles = candles1m.get(fullSymbol);
  if (!candles || candles.length < 21) {
    candles = candles1m.get(baseSymbol);
    if (!candles || candles.length < 21) return null;
  }
  
  const prev = candles[candles.length - 2];
  const curr = candles[candles.length - 1];
  
  if (!prev || !curr) return null;
  
  const prevClose = parseFloat(prev.close);
  const currClose = parseFloat(curr.close);
  const priceChange1m = ((currClose - prevClose) / prevClose) * 100;
  
  const volumes = candles.slice(-21, -1).map(c => parseFloat(c.volume));
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volumeRatio = parseFloat(curr.volume) / avgVolume;
  
  if (Math.abs(priceChange1m) >= SPIKE_PRICE_THRESHOLD && volumeRatio >= SPIKE_VOLUME_RATIO) {
    return {
      symbol: baseSymbol,
      type: priceChange1m > 0 ? 'up' : 'down',
      price_change_1m: priceChange1m,
      price_usdt: currClose,
      volume_ratio: volumeRatio,
      baseline_window: 20
    };
  }
  
  return null;
}

async function fetchAllUsdtSymbols() {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const symbols = response.data.symbols
      .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map(s => s.symbol.toLowerCase());
    return symbols;
  } catch (err) {
    console.error('[BinanceSignal] Failed to fetch symbols:', err.message);
    return [];
  }
}

async function fetch24hTicker() {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    for (const t of response.data) {
      if (t.symbol.endsWith('USDT')) {
        ticker24h.set(t.symbol, {
          priceChange: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
          lastPrice: parseFloat(t.lastPrice)
        });
      }
    }
    console.log(`[BinanceSignal] Updated 24h ticker for ${ticker24h.size} symbols`);
  } catch (err) {
    console.error('[BinanceSignal] Failed to fetch 24h ticker:', err.message);
  }
}

async function fetchKlines(symbol, interval = '1h', limit = 250) {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: symbol.toUpperCase(), interval, limit }
    });
    return response.data.map(k => ({
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
  const upperSymbol = symbol.toUpperCase();
  return ticker24h.get(upperSymbol) || { priceChange: 0, volume: 0, lastPrice: 0 };
}

function getCandles1h(symbol) {
  const baseSymbol = symbol.toUpperCase().replace('USDT', '');
  return candles1h.get(baseSymbol) || [];
}

function startAggTradeStream(symbols) {
  if (symbols.length === 0) return;
  
  const streams = symbols.slice(0, 200).map(s => `${s}@aggTrade`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  
  ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log(`[BinanceSignal] AggTrade WS connected (${Math.min(symbols.length, 200)} symbols)`);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const trade = msg.data;
      if (!trade) return;
      
      const symbol = trade.s;
      const price = parseFloat(trade.p);
      const qty = parseFloat(trade.q);
      const notional = price * qty;
      const timestamp = trade.T;
      const isBuyerMaker = trade.m;
      
      const bucket = getBucket(symbol, timestamp);
      
      if (isBuyerMaker) {
        bucket.sellNotional += notional;
      } else {
        bucket.buyNotional += notional;
      }
    } catch (err) {}
  });
  
  ws.on('close', () => {
    console.log('[BinanceSignal] AggTrade WS disconnected, reconnecting...');
    setTimeout(() => startAggTradeStream(symbols), 5000);
  });
  
  ws.on('error', (err) => {
    console.error('[BinanceSignal] AggTrade WS error:', err.message);
  });
}

function startKlineStream(symbols) {
  if (symbols.length === 0) return;
  
  const streams = symbols.slice(0, 100).map(s => `${s}@kline_1m`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  
  klineWs = new WebSocket(url);
  
  klineWs.on('open', () => {
    console.log(`[BinanceSignal] Kline WS connected (${Math.min(symbols.length, 100)} symbols)`);
  });
  
  klineWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const kline = msg.data?.k;
      if (!kline) return;
      
      const symbol = kline.s;
      const candle = {
        openTime: kline.t,
        open: kline.o,
        high: kline.h,
        low: kline.l,
        close: kline.c,
        volume: kline.v,
        isFinal: kline.x
      };
      
      if (!candles1m.has(symbol)) {
        candles1m.set(symbol, []);
      }
      
      const arr = candles1m.get(symbol);
      
      if (candle.isFinal) {
        arr.push(candle);
        if (arr.length > 100) arr.shift();
      } else {
        if (arr.length > 0 && arr[arr.length - 1].openTime === candle.openTime) {
          arr[arr.length - 1] = candle;
        }
      }
    } catch (err) {}
  });
  
  klineWs.on('close', () => {
    console.log('[BinanceSignal] Kline WS disconnected, reconnecting...');
    setTimeout(() => startKlineStream(symbols), 5000);
  });
  
  klineWs.on('error', (err) => {
    console.error('[BinanceSignal] Kline WS error:', err.message);
  });
}

let currentSymbols = [];

async function initialize() {
  if (isRunning) return;
  isRunning = true;
  
  console.log('[BinanceSignal] Initializing signal engine...');
  
  const symbols = await fetchAllUsdtSymbols();
  console.log(`[BinanceSignal] Found ${symbols.length} USDT trading pairs`);
  
  await fetch24hTicker();
  
  let topSymbols;
  try {
    topSymbols = await getTopSymbols();
    console.log(`[BinanceSignal] Using TOP ${topSymbols.length} symbols by 24h volume`);
  } catch (err) {
    console.warn('[BinanceSignal] Failed to get TOP symbols, using fallback:', err.message);
    topSymbols = FALLBACK_SYMBOLS;
  }
  
  currentSymbols = topSymbols.map(s => s.toLowerCase());
  
  const limit = Math.min(currentSymbols.length, 60);
  for (let i = 0; i < limit; i++) {
    const sym = currentSymbols[i];
    const klines = await fetchKlines(sym, '1h', 250);
    if (klines.length > 0) {
      candles1h.set(sym.toUpperCase().replace('USDT', ''), klines);
    }
    const klines1m = await fetchKlines(sym, '1m', 100);
    if (klines1m.length > 0) {
      candles1m.set(sym.toUpperCase().replace('USDT', ''), klines1m);
    }
  }
  
  startAggTradeStream(currentSymbols.slice(0, 60));
  startKlineStream(currentSymbols.slice(0, 60));
  
  setInterval(() => {
    cleanOldBuckets();
    for (const sym of currentSymbols) {
      updateBaseline(sym.toUpperCase());
    }
  }, 60000);
  
  setInterval(fetch24hTicker, 5 * 60000);
  
  setInterval(async () => {
    try {
      const newSymbols = await getTopSymbols();
      currentSymbols = newSymbols.map(s => s.toLowerCase());
      console.log(`[BinanceSignal] Refreshed symbols: ${currentSymbols.length}`);
    } catch (err) {
      console.warn('[BinanceSignal] Symbol refresh failed:', err.message);
    }
  }, 15 * 60000);
  
  console.log(`[BinanceSignal] Signal engine initialized with ${currentSymbols.length} symbols`);
}

function stop() {
  isRunning = false;
  if (ws) ws.close();
  if (klineWs) klineWs.close();
}

module.exports = {
  initialize,
  stop,
  checkWhaleCondition,
  checkSpikeCondition,
  get24hData,
  getCandles1h,
  getLastMinuteBucket,
  candles1m,
  candles1h,
  ticker24h
};
