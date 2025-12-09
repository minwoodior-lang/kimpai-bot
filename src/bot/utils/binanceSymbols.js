/**
 * Binance TOP 60 심볼 자동 선택 모듈
 * 24h 거래량 기준으로 상위 60개 USDT 페어 선택
 * 15분마다 자동 업데이트
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../../../data/topSymbols.json');
const UPDATE_INTERVAL = 15 * 60 * 1000;
const TOP_LIMIT = 60;
const MUST_INCLUDE = ['BTCUSDT', 'ETHUSDT'];

let cachedSymbols = [];
let lastUpdateTime = 0;

const FALLBACK_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'SHIBUSDT', 'DOTUSDT',
  'LINKUSDT', 'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT',
  'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT'
];

async function fetchTop60Symbols() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    const usdtPairs = data
      .filter(row => row.symbol.endsWith('USDT') && !row.symbol.includes('UP') && !row.symbol.includes('DOWN'))
      .map(row => ({
        symbol: row.symbol,
        quoteVolume: parseFloat(row.quoteVolume || 0),
        lastPrice: parseFloat(row.lastPrice || 0),
        priceChangePercent: parseFloat(row.priceChangePercent || 0)
      }))
      .filter(row => row.quoteVolume > 0 && row.lastPrice > 0)
      .sort((a, b) => b.quoteVolume - a.quoteVolume);
    
    let top = usdtPairs.slice(0, TOP_LIMIT);
    
    for (const must of MUST_INCLUDE) {
      if (!top.find(s => s.symbol === must)) {
        const found = usdtPairs.find(s => s.symbol === must);
        if (found) {
          top.push(found);
        }
      }
    }
    
    const symbols = top.map(s => s.symbol);
    
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        symbols,
        updatedAt: new Date().toISOString(),
        count: symbols.length
      }, null, 2));
    } catch (writeErr) {
      console.warn('[TopSymbols] Cache write failed:', writeErr.message);
    }
    
    cachedSymbols = symbols;
    lastUpdateTime = Date.now();
    
    console.log(`[TopSymbols] Updated: ${symbols.length} symbols (Top 60 by 24h volume)`);
    
    return symbols;
  } catch (err) {
    console.error('[TopSymbols] Fetch error:', err.message);
    return loadCachedOrFallback();
  }
}

function loadCachedOrFallback() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data.symbols && data.symbols.length > 0) {
        cachedSymbols = data.symbols;
        console.log(`[TopSymbols] Loaded from cache: ${cachedSymbols.length} symbols`);
        return cachedSymbols;
      }
    }
  } catch (err) {
    console.warn('[TopSymbols] Cache read failed:', err.message);
  }
  
  console.log('[TopSymbols] Using fallback symbols');
  cachedSymbols = FALLBACK_SYMBOLS;
  return FALLBACK_SYMBOLS;
}

async function getTopSymbols() {
  const now = Date.now();
  
  if (cachedSymbols.length > 0 && (now - lastUpdateTime) < UPDATE_INTERVAL) {
    return cachedSymbols;
  }
  
  return await fetchTop60Symbols();
}

function getTopSymbolsSync() {
  if (cachedSymbols.length > 0) {
    return cachedSymbols;
  }
  return loadCachedOrFallback();
}

function startAutoUpdate() {
  fetchTop60Symbols();
  
  setInterval(() => {
    fetchTop60Symbols();
  }, UPDATE_INTERVAL);
  
  console.log('[TopSymbols] Auto-update started (every 15 minutes)');
}

function getSymbolsWithoutSuffix() {
  return cachedSymbols.map(s => s.replace('USDT', ''));
}

module.exports = {
  fetchTop60Symbols,
  getTopSymbols,
  getTopSymbolsSync,
  startAutoUpdate,
  getSymbolsWithoutSuffix,
  FALLBACK_SYMBOLS
};
