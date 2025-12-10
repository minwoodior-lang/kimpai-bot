const WebSocket = require('ws');
const axios = require('axios');
const { getTopSymbols, FALLBACK_SYMBOLS } = require('../bot/utils/binanceSymbols');

const BASELINE_WINDOW = 20;

// FREE 고래 시그널 v2.3b 필터 상수 (조건 완화)
const MAJOR_COINS = ['BTC', 'ETH', 'BNB', 'SOL'];
const MIN_24H_VOLUME_USDT = 2000000; // 24h 거래액 하한 (3M → 2M)

// 일반 코인
const MIN_VOLUME_USDT = 12000; // 최근 N분 체결 금액 (20K → 12K)
const WHALE_VOLUME_RATIO = 4.0; // 거래량 배수 (6.0 → 4.0)

// 메이저 코인
const MAJOR_MIN_VOLUME_USDT = 80000; // (100K → 80K)
const MAJOR_WHALE_VOLUME_RATIO = 3.0; // (4.0 → 3.0)

// 전역 상태 저장소 (API 라우트에서 접근 가능)
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

// 엔진 상태 추적 (v2.4 강화) - global에서 읽기/쓰기
let lastUpdateTime = globalState.lastUpdateTime;
let lastTradeTime = globalState.lastTradeTime;
let recentTradeCount = globalState.recentTradeCount;
let lastErrorMessage = globalState.lastErrorMessage;
let engineErrors = globalState.engineErrors;
let restartCount = globalState.restartCount;
let lastRestartTime = globalState.lastRestartTime;

// WebSocket 헬스 상수
const WS_PING_INTERVAL = 30000; // 30초마다 ping
const WS_PONG_TIMEOUT = 10000; // 10초 pong 타임아웃
const TRADE_STALE_THRESHOLD = 90000; // 90초간 트레이드 없으면 재시작
const MAX_RESTART_INTERVAL = 300000; // 5분 내 재시작 제한

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

// 상태 동기화 함수
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
  const baseSymbol = fullSymbol.replace('USDT', '');
  
  const bucket = getLastMinuteBucket(fullSymbol);
  if (!bucket) return null;
  
  const baseline = baselineVolumes.get(fullSymbol);
  if (!baseline || baseline < 100) return null;
  
  // 24h 거래액 필터 확인 (volume은 quoteVolume - USDT 기준)
  const ticker24hData = ticker24h.get(fullSymbol);
  if (ticker24hData) {
    const volume24h = ticker24hData.volume || 0;
    if (volume24h < MIN_24H_VOLUME_USDT) return null;
  }
  
  const volume1m = bucket.buyNotional + bucket.sellNotional;
  
  // 메이저 코인 vs 일반 코인 필터 적용
  const isMajor = MAJOR_COINS.includes(baseSymbol);
  const minVolume = isMajor ? MAJOR_MIN_VOLUME_USDT : MIN_VOLUME_USDT;
  const minRatio = isMajor ? MAJOR_WHALE_VOLUME_RATIO : WHALE_VOLUME_RATIO;
  
  if (volume1m < minVolume) return null;
  
  const ratio = volume1m / baseline;
  if (ratio < minRatio) return null;
  
  const buyRatio = bucket.buyNotional / volume1m;
  const sellRatio = bucket.sellNotional / volume1m;
  
  if (buyRatio >= 0.65) {
    return {
      symbol: baseSymbol,
      side: '매수',
      side_emoji: '🟢',
      volume_usdt: volume1m,
      buy_notional: bucket.buyNotional,
      sell_notional: bucket.sellNotional,
      volume_ratio: ratio,
      baseline_window: BASELINE_WINDOW
    };
  }
  
  if (sellRatio >= 0.65) {
    return {
      symbol: baseSymbol,
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
    lastUpdateTime = Date.now(); // ticker 업데이트만 (트레이드와 분리)
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

// WebSocket 완전 정리 함수
function closeWebSocket(socket, pingInterval) {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  if (socket) {
    socket.removeAllListeners();
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.terminate();
    }
  }
}

function startAggTradeStream(symbols) {
  if (symbols.length === 0) return;
  
  // 기존 소켓 완전 정리
  closeWebSocket(ws, wsPingInterval);
  ws = null;
  wsPingInterval = null;
  pendingPong = false;
  
  const streams = symbols.slice(0, 200).map(s => `${s}@aggTrade`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  
  ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log(`[BinanceSignal] AggTrade WS connected (${Math.min(symbols.length, 200)} symbols)`);
    lastTradeTime = Date.now(); // 연결 시점 기록
    syncGlobalState(); // WS 연결 상태 즉시 동기화
    
    // Ping/Pong 헬스체크 시작
    wsPingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (pendingPong) {
          console.warn('[BinanceSignal] AggTrade WS pong timeout, forcing reconnect...');
          recordError('AggTrade WS pong timeout');
          closeWebSocket(ws, wsPingInterval);
          setTimeout(() => startAggTradeStream(currentSymbols.slice(0, 60)), 1000);
          return;
        }
        pendingPong = true;
        ws.ping();
      }
    }, WS_PING_INTERVAL);
  });
  
  ws.on('pong', () => {
    pendingPong = false;
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
      
      lastTradeTime = Date.now(); // 실제 트레이드 시점만 기록
      recentTradeCount++;
    } catch (err) {}
  });
  
  ws.on('close', (code, reason) => {
    console.log(`[BinanceSignal] AggTrade WS disconnected (code: ${code}), reconnecting in 3s...`);
    recordError(`AggTrade WS closed: ${code}`);
    closeWebSocket(ws, wsPingInterval);
    syncGlobalState(); // WS 연결 해제 상태 즉시 동기화
    ws = null;
    wsPingInterval = null;
    setTimeout(() => {
      if (isRunning) startAggTradeStream(currentSymbols.slice(0, 60));
    }, 3000);
  });
  
  ws.on('error', (err) => {
    console.error('[BinanceSignal] AggTrade WS error:', err.message);
    recordError('AggTrade WS error: ' + err.message);
  });
}

function startKlineStream(symbols) {
  if (symbols.length === 0) return;
  
  // 기존 소켓 완전 정리
  closeWebSocket(klineWs, klineWsPingInterval);
  klineWs = null;
  klineWsPingInterval = null;
  pendingKlinePong = false;
  
  const streams = symbols.slice(0, 100).map(s => `${s}@kline_1m`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  
  klineWs = new WebSocket(url);
  
  klineWs.on('open', () => {
    console.log(`[BinanceSignal] Kline WS connected (${Math.min(symbols.length, 100)} symbols)`);
    syncGlobalState(); // WS 연결 상태 즉시 동기화
    
    // Ping/Pong 헬스체크 시작
    klineWsPingInterval = setInterval(() => {
      if (klineWs && klineWs.readyState === WebSocket.OPEN) {
        if (pendingKlinePong) {
          console.warn('[BinanceSignal] Kline WS pong timeout, forcing reconnect...');
          recordError('Kline WS pong timeout');
          closeWebSocket(klineWs, klineWsPingInterval);
          setTimeout(() => startKlineStream(currentSymbols.slice(0, 60)), 1000);
          return;
        }
        pendingKlinePong = true;
        klineWs.ping();
      }
    }, WS_PING_INTERVAL);
  });
  
  klineWs.on('pong', () => {
    pendingKlinePong = false;
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
  
  klineWs.on('close', (code, reason) => {
    console.log(`[BinanceSignal] Kline WS disconnected (code: ${code}), reconnecting in 3s...`);
    recordError(`Kline WS closed: ${code}`);
    closeWebSocket(klineWs, klineWsPingInterval);
    syncGlobalState(); // WS 연결 해제 상태 즉시 동기화
    klineWs = null;
    klineWsPingInterval = null;
    setTimeout(() => {
      if (isRunning) startKlineStream(currentSymbols.slice(0, 60));
    }, 3000);
  });
  
  klineWs.on('error', (err) => {
    console.error('[BinanceSignal] Kline WS error:', err.message);
    recordError('Kline WS error: ' + err.message);
  });
}

let currentSymbols = [];
let baselineInterval = null;
let tickerInterval = null;
let symbolRefreshInterval = null;

async function initialize() {
  if (isRunning) {
    console.log('[BinanceSignal] Engine already running, skipping initialize');
    return;
  }
  isRunning = true;
  syncGlobalState();
  
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
  
  // Baseline 업데이트 인터벌
  baselineInterval = setInterval(() => {
    cleanOldBuckets();
    for (const sym of currentSymbols) {
      updateBaseline(sym.toUpperCase());
    }
  }, 60000);
  
  // 24h Ticker 업데이트 인터벌
  tickerInterval = setInterval(fetch24hTicker, 5 * 60000);
  
  // 심볼 갱신 인터벌
  symbolRefreshInterval = setInterval(async () => {
    try {
      const newSymbols = await getTopSymbols();
      currentSymbols = newSymbols.map(s => s.toLowerCase());
      console.log(`[BinanceSignal] Refreshed symbols: ${currentSymbols.length}`);
    } catch (err) {
      console.warn('[BinanceSignal] Symbol refresh failed:', err.message);
    }
  }, 15 * 60000);
  
  lastTradeTime = Date.now();
  syncGlobalState();
  console.log(`[BinanceSignal] Signal engine initialized with ${currentSymbols.length} symbols`);
}

// 완전 정지 함수 (모든 인터벌 및 소켓 정리)
function stop() {
  console.log('[BinanceSignal] Stopping engine...');
  isRunning = false;
  syncGlobalState();
  
  // 모든 인터벌 정리
  if (baselineInterval) { clearInterval(baselineInterval); baselineInterval = null; }
  if (tickerInterval) { clearInterval(tickerInterval); tickerInterval = null; }
  if (symbolRefreshInterval) { clearInterval(symbolRefreshInterval); symbolRefreshInterval = null; }
  if (healthCheckInterval) { clearInterval(healthCheckInterval); healthCheckInterval = null; }
  
  // WebSocket 완전 정리
  closeWebSocket(ws, wsPingInterval);
  closeWebSocket(klineWs, klineWsPingInterval);
  ws = null;
  klineWs = null;
  wsPingInterval = null;
  klineWsPingInterval = null;
  pendingPong = false;
  pendingKlinePong = false;
  
  console.log('[BinanceSignal] Engine stopped');
}

// 데이터 초기화 함수
function clearAllData() {
  tradeBuckets.clear();
  baselineVolumes.clear();
  candles1m.clear();
  candles1h.clear();
  // ticker24h는 유지 (API 호출 줄이기 위해)
  recentTradeCount = 0;
  lastTradeTime = 0;
}

function getStatus() {
  const now = Date.now();
  const wsConnected = ws && ws.readyState === WebSocket.OPEN;
  const klineWsConnected = klineWs && klineWs.readyState === WebSocket.OPEN;
  const tradeStale = lastTradeTime > 0 && (now - lastTradeTime) > TRADE_STALE_THRESHOLD;
  
  // 전역 상태 동기화
  syncGlobalState();
  
  // 건강 상태 판단
  const isHealthy = wsConnected && klineWsConnected && 
                    tradeBuckets.size > 0 && 
                    baselineVolumes.size > 50 && 
                    !tradeStale;
  
  return {
    running: isRunning,
    healthy: isHealthy,
    lastUpdate: lastUpdateTime,
    lastUpdateAgo: Math.floor((now - lastUpdateTime) / 1000),
    lastTradeTime: lastTradeTime,
    lastTradeAgo: lastTradeTime > 0 ? Math.floor((now - lastTradeTime) / 1000) : -1,
    tradeStale: tradeStale,
    wsConnected,
    klineWsConnected,
    recentTrades: recentTradeCount,
    symbolCount: currentSymbols.length,
    tradeBucketCount: tradeBuckets.size,
    baselineCount: baselineVolumes.size,
    ticker24hCount: ticker24h.size,
    restartCount: restartCount,
    lastRestartTime: lastRestartTime,
    lastError: lastErrorMessage,
    errors: engineErrors.slice(-10)
  };
}

function recordError(message) {
  lastErrorMessage = message;
  engineErrors.push({
    time: Date.now(),
    message
  });
  if (engineErrors.length > 100) {
    engineErrors = engineErrors.slice(-50);
  }
}

async function restart() {
  const now = Date.now();
  
  // 재시작 폭주 방지 (5분 내 연속 재시작 제한)
  if (lastRestartTime > 0 && (now - lastRestartTime) < MAX_RESTART_INTERVAL) {
    console.warn('[BinanceSignal] Restart throttled (too frequent)');
    return false;
  }
  
  console.log('[BinanceSignal] ========== FULL RESTART ==========');
  
  // 1. 완전 정지
  stop();
  
  // 2. 데이터 초기화
  clearAllData();
  
  // 3. 쿨다운
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 4. 재초기화
  restartCount++;
  lastRestartTime = now;
  
  await initialize();
  
  // 5. 헬스체크 재시작
  startHealthCheck();
  
  console.log('[BinanceSignal] Engine restarted successfully (restart #' + restartCount + ')');
  return true;
}

let healthCheckInterval = null;

function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  console.log('[BinanceSignal] Starting health check (every 30s)...');
  
  healthCheckInterval = setInterval(() => {
    const status = getStatus();
    const now = Date.now();
    
    // 조건 1: 90초간 트레이드 없음 (가장 중요)
    if (status.lastTradeTime > 0 && (now - status.lastTradeTime) > TRADE_STALE_THRESHOLD) {
      console.warn(`[BinanceSignal] No trades for ${Math.floor((now - status.lastTradeTime) / 1000)}s, forcing restart...`);
      recordError(`No trades for ${Math.floor((now - status.lastTradeTime) / 1000)}s`);
      restart().catch(err => {
        console.error('[BinanceSignal] Restart failed:', err.message);
        recordError('Restart failed: ' + err.message);
      });
      return;
    }
    
    // 조건 2: WebSocket 끊김 (readyState 체크)
    if (!status.wsConnected && isRunning) {
      console.warn('[BinanceSignal] AggTrade WebSocket not connected, reconnecting...');
      recordError('AggTrade WebSocket disconnected');
      startAggTradeStream(currentSymbols.slice(0, 60));
    }
    
    if (!status.klineWsConnected && isRunning) {
      console.warn('[BinanceSignal] Kline WebSocket not connected, reconnecting...');
      recordError('Kline WebSocket disconnected');
      startKlineStream(currentSymbols.slice(0, 60));
    }
    
    // 조건 3: 버킷/베이스라인 없음 (데이터 손상)
    if (isRunning && status.lastTradeTime > 0 && (now - status.lastTradeTime) > 60000) {
      if (status.tradeBucketCount === 0 || status.baselineCount === 0) {
        console.warn('[BinanceSignal] Empty buckets/baselines detected, forcing restart...');
        recordError('Empty buckets or baselines');
        restart().catch(err => {
          console.error('[BinanceSignal] Restart failed:', err.message);
        });
        return;
      }
    }
    
    // 상태 로그 (디버그용)
    if (process.env.NODE_ENV === 'development' || status.tradeStale) {
      console.log(`[BinanceSignal] Health: WS=${status.wsConnected ? '✓' : '✗'} Kline=${status.klineWsConnected ? '✓' : '✗'} ` +
                  `Trades=${status.recentTrades} Buckets=${status.tradeBucketCount} Baselines=${status.baselineCount} ` +
                  `LastTrade=${status.lastTradeAgo}s ago`);
    }
  }, 30 * 1000); // 30초마다 체크
}

module.exports = {
  initialize,
  stop,
  restart,
  getStatus,
  startHealthCheck,
  checkWhaleCondition,
  checkSpikeCondition,
  get24hData,
  getCandles1h,
  getLastMinuteBucket,
  candles1m,
  candles1h,
  ticker24h
};
