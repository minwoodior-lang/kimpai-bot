import fs from 'fs';
import path from 'path';
import * as cron from 'node-cron';
import axios from 'axios';
import {
  fetchUpbitPrices,
  fetchBithumbPrices,
  fetchCoinonePrices,
  fetchBinanceSpotPrices,
  fetchBinanceFuturesPrices,
  fetchOkxPrices,
  fetchBybitPrices,
  fetchBitgetPrices,
  fetchGatePrices,
  fetchHtxPrices,
  fetchMexcPrices,
  fetchBithumbStats,
  fetchCoinoneStats,
  fetchBinanceStats,
  fetchBinanceFuturesStats,
  fetchOkxStats,
  fetchBybitStats,
  fetchBitgetStats,
  fetchGateStats,
  fetchHtxStats,
  fetchMexcStats,
  setGlobalUsdKrwRate,
  type MarketInfo,
  type PriceMap,
  type MarketStatsMap,
  type MarketStatsEntry
} from './fetchers';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const PREMIUM_TABLE_FILE = path.join(DATA_DIR, 'premiumTable.json');
const EXCHANGE_MARKETS_FILE = path.join(DATA_DIR, 'exchange_markets.json');
const MASTER_SYMBOLS_FILE = path.join(DATA_DIR, 'master_symbols.json');
const MARKET_STATS_FILE = path.join(DATA_DIR, 'marketStats.json');
const HEALTH_CHECK_FILE = path.join(DATA_DIR, 'healthCheck.json');

let currentPrices: PriceMap = {};
let currentMarketStats: MarketStatsMap = {};
let usdKrwRate = 1380;
let usdtKrwGlobal = 1450;
let lastFxUpdate = 0;
let lastHealthCheck: { pricesCount: number; marketsCount: number; timestamp: number } | null = null;
let skippedSymbols: string[] = [];

function loadExchangeMarkets(): MarketInfo[] {
  try {
    return JSON.parse(fs.readFileSync(EXCHANGE_MARKETS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function loadMasterSymbols(): any[] {
  try {
    return JSON.parse(fs.readFileSync(MASTER_SYMBOLS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

async function updateGlobalUsdtKrw(): Promise<void> {
  const now = Date.now();
  if (now - lastFxUpdate < 300000) return;

  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=krw', { timeout: 5000 });
    const tetherKrw = res.data?.tether?.krw;
    if (tetherKrw && typeof tetherKrw === 'number') {
      usdtKrwGlobal = tetherKrw;
      usdKrwRate = tetherKrw;
      setGlobalUsdKrwRate(tetherKrw);
      lastFxUpdate = now;
      console.log(`[USDT] Global USDT/KRW updated: ₩${usdtKrwGlobal.toLocaleString()}`);
    }
  } catch (err: any) {
    console.warn('[USDT] CoinGecko fetch failed, using cached rate:', usdtKrwGlobal);
  }
}

function filterMarkets(markets: MarketInfo[], exchange: string, quotes: string[]): MarketInfo[] {
  return markets.filter(m => 
    m.exchange === exchange && quotes.includes(m.quote)
  );
}

interface ValidationResult {
  isValid: boolean;
  invalidPrices: string[];
  skippedSymbols: string[];
}

function validatePricesBeforeSave(prices: PriceMap, markets: MarketInfo[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    invalidPrices: [],
    skippedSymbols: []
  };

  const domesticExchanges = [
    { exchange: 'UPBIT', quotes: ['KRW', 'BTC', 'USDT'] },
    { exchange: 'BITHUMB', quotes: ['KRW', 'BTC'] },
    { exchange: 'COINONE', quotes: ['KRW'] },
  ];

  for (const { exchange, quotes } of domesticExchanges) {
    for (const quote of quotes) {
      const exchangeMarkets = markets.filter(m => m.exchange === exchange && m.quote === quote);
      
      for (const market of exchangeMarkets) {
        const key = `${exchange}:${market.base}:${quote}`;
        const priceEntry = prices[key];
        
        if (!priceEntry) {
          result.skippedSymbols.push(key);
          continue;
        }
        
        if (!priceEntry.price || priceEntry.price <= 0 || isNaN(priceEntry.price) || !isFinite(priceEntry.price)) {
          result.invalidPrices.push(`${key}:${priceEntry.price}`);
        }
      }
    }
  }

  if (result.invalidPrices.length > 10) {
    result.isValid = false;
  }

  return result;
}

function performHealthCheck(currentCount: number): boolean {
  if (!lastHealthCheck) {
    lastHealthCheck = {
      pricesCount: currentCount,
      marketsCount: loadExchangeMarkets().length,
      timestamp: Date.now()
    };
    saveHealthCheck();
    return true;
  }

  const prevCount = lastHealthCheck.pricesCount;
  const dropPercent = ((prevCount - currentCount) / prevCount) * 100;

  if (dropPercent > 20) {
    console.error(`[HealthCheck] ALERT: Price count dropped ${dropPercent.toFixed(1)}% (${prevCount} → ${currentCount})`);
    return false;
  }

  lastHealthCheck = {
    pricesCount: currentCount,
    marketsCount: loadExchangeMarkets().length,
    timestamp: Date.now()
  };
  saveHealthCheck();
  return true;
}

function saveHealthCheck(): void {
  try {
    fs.writeFileSync(HEALTH_CHECK_FILE, JSON.stringify(lastHealthCheck, null, 2), 'utf-8');
  } catch {}
}

function loadHealthCheck(): void {
  try {
    const data = fs.readFileSync(HEALTH_CHECK_FILE, 'utf-8');
    lastHealthCheck = JSON.parse(data);
  } catch {
    lastHealthCheck = null;
  }
}

function savePrices(prices: PriceMap): void {
  const tmpFile = PRICES_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(prices, null, 2), 'utf-8');
  fs.renameSync(tmpFile, PRICES_FILE);
}

function saveMarketStats(stats: MarketStatsMap): void {
  const tmpFile = MARKET_STATS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(stats, null, 2), 'utf-8');
  fs.renameSync(tmpFile, MARKET_STATS_FILE);
}

async function fetchUpbitMarketStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  const result: MarketStatsMap = {};
  
  // KRW, BTC, USDT 마켓 모두 처리
  const upbitMarkets = markets
    .filter(m => m.exchange === 'UPBIT' && ['KRW', 'BTC', 'USDT'].includes(m.quote))
    .map(m => m.market);

  if (upbitMarkets.length === 0) return result;

  const chunkSize = 80;
  const chunks: string[][] = [];
  
  for (let i = 0; i < upbitMarkets.length; i += chunkSize) {
    chunks.push(upbitMarkets.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    try {
      const url = `https://api.upbit.com/v1/ticker?markets=${chunk.join(',')}`;
      const res = await axios.get(url, { timeout: 5000 });
      
      if (!Array.isArray(res.data)) continue;

      for (const ticker of res.data) {
        const market = ticker.market as string;
        const [quote, base] = market.split('-');
        const key = `UPBIT:${base}:${quote}`;

        result[key] = {
          change24hRate: (ticker.signed_change_rate ?? 0) * 100,
          change24hAbs: ticker.signed_change_price ?? 0,
          high24h: ticker.high_price ?? null,
          low24h: ticker.low_price ?? null,
          volume24hQuote: ticker.acc_trade_price_24h ?? 0
        };
      }
    } catch (err: any) {
      console.warn('[Stats] Upbit ticker fetch failed:', err.message);
    }
  }

  return result;
}

function buildPremiumTable(): void {
  const masterSymbols = loadMasterSymbols();
  const symbolMap = new Map(masterSymbols.map((s: any) => [s.symbol, s]));

  const domesticSymbols: string[] = [];
  const globalSymbols: string[] = [];

  for (const key of Object.keys(currentPrices)) {
    const [exchange, base] = key.split(':');
    if (['UPBIT', 'BITHUMB', 'COINONE'].includes(exchange)) {
      if (!domesticSymbols.includes(base)) domesticSymbols.push(base);
    } else {
      if (!globalSymbols.includes(base)) globalSymbols.push(base);
    }
  }

  const allSymbols = Array.from(new Set([...domesticSymbols, ...globalSymbols]));
  const premiumRows: any[] = [];

  for (const symbol of allSymbols) {
    const koreanPrice = getKoreanPrice(symbol);
    const globalPrice = getGlobalPrice(symbol);

    if (!koreanPrice && !globalPrice) continue;

    let premium = 0;
    if (koreanPrice && globalPrice && globalPrice > 0) {
      const globalKrw = globalPrice * usdKrwRate;
      premium = ((koreanPrice - globalKrw) / globalKrw) * 100;
    }

    const master = symbolMap.get(symbol) || {};

    let finalPremium = null;
    if (koreanPrice && globalPrice && globalPrice > 0) {
      finalPremium = Math.round(premium * 100) / 100;
    }

    // prices.json에서 직접 가져온 데이터
    const domesticPriceEntry = getDomesticPriceEntry(symbol);
    const globalPriceEntry = getGlobalPriceEntry(symbol);

    premiumRows.push({
      symbol,
      name_ko: master.name_ko || symbol,
      name_en: master.name_en || symbol,
      koreanPrice,
      globalPrice,
      premium: finalPremium,
      usdKrw: usdKrwRate,
      iconUrl: master.icon_path || null,
      cmcSlug: master.cmc_slug || null,
      // 모든 데이터는 prices.json에서 직접 가져옴 (nullish coalescing 사용!)
      volume24hKrw: domesticPriceEntry?.volume24hKrw ?? null,
      volume24hForeignKrw: globalPriceEntry?.volume24hKrw ?? null,
      change24hRate: domesticPriceEntry?.change24hRate ?? null,
      change24hAbs: domesticPriceEntry?.change24hAbs ?? null,
      high24h: domesticPriceEntry?.high24h ?? null,
      low24h: domesticPriceEntry?.low24h ?? null,
      updatedAt: Date.now()
    });
  }

  premiumRows.sort((a, b) => {
    const aPrem = a.premium ?? -Infinity;
    const bPrem = b.premium ?? -Infinity;
    return bPrem - aPrem;
  });

  const tmpFile = PREMIUM_TABLE_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(premiumRows, null, 2), 'utf-8');
  fs.renameSync(tmpFile, PREMIUM_TABLE_FILE);

  console.log(`[Premium] Updated ${premiumRows.length} rows`);
}

function getKoreanPrice(symbol: string): number | null {
  const priority = ['UPBIT', 'BITHUMB', 'COINONE'];
  for (const ex of priority) {
    const key = `${ex}:${symbol}:KRW`;
    if (currentPrices[key]) {
      return currentPrices[key].price;
    }
  }
  return null;
}

function getDomesticPriceEntry(symbol: string): any {
  const priorityExchanges = ['UPBIT', 'BITHUMB', 'COINONE'];
  
  // 1순위: KRW 마켓 (직접 원화 거래대금 있음)
  for (const ex of priorityExchanges) {
    const krwKey = `${ex}:${symbol}:KRW`;
    if (currentPrices[krwKey] && currentPrices[krwKey].volume24hKrw != null) {
      return currentPrices[krwKey];
    }
  }
  
  // 2순위: USDT 마켓 → 원화 환산
  for (const ex of priorityExchanges) {
    const usdtKey = `${ex}:${symbol}:USDT`;
    if (currentPrices[usdtKey]) {
      const entry = { ...currentPrices[usdtKey] };
      // USDT 거래대금을 KRW로 환산 (volume24hQuote 또는 기존 volume24hKrw 사용)
      if (entry.volume24hQuote && entry.volume24hQuote > 0) {
        entry.volume24hKrw = entry.volume24hQuote * usdtKrwGlobal;
      } else if (entry.volume24hKrw == null || entry.volume24hKrw === 0) {
        // 글로벌 USDT 거래소에서 volume 가져오기
        const globalEntry = getGlobalPriceEntry(symbol);
        if (globalEntry?.volume24hQuote && globalEntry.volume24hQuote > 0) {
          entry.volume24hKrw = globalEntry.volume24hQuote * usdtKrwGlobal;
        }
      }
      if (entry.volume24hKrw != null && entry.volume24hKrw > 0) {
        return entry;
      }
    }
  }
  
  // 3순위: BTC 마켓 → 원화 환산
  for (const ex of priorityExchanges) {
    const btcKey = `${ex}:${symbol}:BTC`;
    if (currentPrices[btcKey]) {
      const entry = { ...currentPrices[btcKey] };
      // BTC/KRW 가격 가져오기
      const btcKrwPrice = currentPrices['UPBIT:BTC:KRW']?.price || 
                          currentPrices['BITHUMB:BTC:KRW']?.price || 
                          currentPrices['COINONE:BTC:KRW']?.price;
      if (btcKrwPrice && btcKrwPrice > 0) {
        // BTC 거래대금을 KRW로 환산
        if (entry.volume24hQuote && entry.volume24hQuote > 0) {
          entry.volume24hKrw = entry.volume24hQuote * btcKrwPrice;
        }
      }
      if (entry.volume24hKrw != null && entry.volume24hKrw > 0) {
        return entry;
      }
    }
  }
  
  // 4순위: 글로벌 거래소 USDT 마켓에서 거래대금 가져오기 (KRW 마켓이 아예 없는 코인)
  const globalEntry = getGlobalPriceEntry(symbol);
  if (globalEntry) {
    const entry = { ...globalEntry };
    if (globalEntry.volume24hQuote && globalEntry.volume24hQuote > 0) {
      entry.volume24hKrw = globalEntry.volume24hQuote * usdtKrwGlobal;
    }
    if (entry.volume24hKrw != null && entry.volume24hKrw > 0) {
      return entry;
    }
  }
  
  return null;
}

function getGlobalPriceEntry(symbol: string): any {
  const priority = ['BINANCE', 'BINANCE_FUTURES', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'HTX', 'MEXC'];
  
  // 1순위: volume24hQuote가 있는 글로벌 거래소
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    const entry = currentPrices[key];
    if (entry && entry.volume24hQuote && entry.volume24hQuote > 0) {
      return entry;
    }
  }
  
  // 2순위: marketStats에서 volume24hQuote 가져오기 (Binance 등)
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    const entry = currentPrices[key];
    if (entry) {
      const stats = currentMarketStats[key];
      if (stats && stats.volume24hQuote && stats.volume24hQuote > 0) {
        return { ...entry, volume24hQuote: stats.volume24hQuote };
      }
    }
  }
  
  // 3순위: 가격만 있는 글로벌 거래소
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    if (currentPrices[key]) {
      return currentPrices[key];
    }
  }
  
  return null;
}

function getKoreanStatsKey(symbol: string): string | null {
  const priority = ['UPBIT', 'BITHUMB', 'COINONE'];
  for (const ex of priority) {
    const key = `${ex}:${symbol}:KRW`;
    if (currentMarketStats[key]) {
      return key;
    }
  }
  return null;
}

function getGlobalPrice(symbol: string): number | null {
  // USDT 심볼은 CoinGecko 글로벌 테더 시세 사용 (price = 1 USDT)
  if (symbol === 'USDT') {
    return 1;
  }
  
  const priority = ['BINANCE', 'BINANCE_FUTURES', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'HTX', 'MEXC'];
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    if (currentPrices[key]) {
      return currentPrices[key].price;
    }
  }
  return null;
}

function getGlobalStatsKey(symbol: string): string | null {
  const priority = ['BINANCE', 'BINANCE_FUTURES', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'HTX', 'MEXC'];
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    if (currentMarketStats[key]) {
      return key;
    }
  }
  return null;
}

function getGlobalMarkets(): MarketInfo[] {
  const allMarkets = loadExchangeMarkets();
  const upbitMarkets = filterMarkets(allMarkets, 'UPBIT', ['KRW', 'BTC', 'USDT']);
  // 빗썸은 KRW/BTC 마켓만 존재 (USDT 마켓 없음)
  const bithumbMarkets = filterMarkets(allMarkets, 'BITHUMB', ['KRW', 'BTC']);
  const coinoneMarkets = filterMarkets(allMarkets, 'COINONE', ['KRW']);

  const globalBases = new Set([...upbitMarkets, ...bithumbMarkets, ...coinoneMarkets].map(m => m.base.toUpperCase()));
  return Array.from(globalBases).map(base => ({
    id: `GLOBAL:${base}:USDT`,
    exchange: 'GLOBAL',
    market: `${base}USDT`,
    base,
    quote: 'USDT'
  }));
}

async function updatePricesOnly(): Promise<void> {
  const startTime = Date.now();
  const allMarkets = loadExchangeMarkets();

  await updateGlobalUsdtKrw();

  const upbitMarkets = filterMarkets(allMarkets, 'UPBIT', ['KRW', 'BTC', 'USDT']);
  // 빗썸은 KRW/BTC 마켓만 존재 (USDT 마켓 없음)
  const bithumbMarkets = filterMarkets(allMarkets, 'BITHUMB', ['KRW', 'BTC']);
  const coinoneMarkets = filterMarkets(allMarkets, 'COINONE', ['KRW']);
  const globalMarkets = getGlobalMarkets();

  try {
    const priceResults = await Promise.allSettled([
      fetchUpbitPrices(upbitMarkets),
      fetchBithumbPrices(bithumbMarkets),
      fetchCoinonePrices(coinoneMarkets),
      fetchBinanceSpotPrices(globalMarkets),
      fetchBinanceFuturesPrices(globalMarkets),
      fetchOkxPrices(globalMarkets),
      fetchBybitPrices(globalMarkets),
      fetchBitgetPrices(globalMarkets),
      fetchGatePrices(globalMarkets),
      fetchHtxPrices(globalMarkets),
      fetchMexcPrices(globalMarkets)
    ]);

    for (const result of priceResults) {
      if (result.status === 'fulfilled') {
        Object.assign(currentPrices, result.value);
      }
    }

    // GLOBAL:USDT:USDT 엔트리 생성 (CoinGecko 글로벌 테더 시세)
    if (usdtKrwGlobal) {
      currentPrices['GLOBAL:USDT:USDT'] = {
        price: 1,
        ts: Date.now()
      };
    }

    // 모든 해외 거래소 USDT 심볼에 CoinGecko 글로벌 테더 값 적용
    const foreignExchanges = ['BINANCE', 'BINANCE_FUTURES', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'HTX', 'MEXC'];
    for (const exchange of foreignExchanges) {
      const key = `${exchange}:USDT:USDT`;
      currentPrices[key] = {
        price: 1,
        ts: Date.now()
      };
    }

    // 저장 전 검증
    const validation = validatePricesBeforeSave(currentPrices, allMarkets);
    
    if (validation.invalidPrices.length > 0) {
      console.warn(`[Validate] Invalid prices (${validation.invalidPrices.length}): ${validation.invalidPrices.slice(0, 5).join(', ')}${validation.invalidPrices.length > 5 ? '...' : ''}`);
    }

    if (!validation.isValid) {
      console.error('[Validate] BLOCKED: Too many invalid prices, keeping previous data');
      return;
    }

    // Health Check
    const priceCount = Object.keys(currentPrices).length;
    if (!performHealthCheck(priceCount)) {
      console.error('[HealthCheck] BLOCKED: Price count dropped significantly, keeping previous data');
      return;
    }

    // ▼ 디버그용: KRW 마켓인데 거래대금이 비어 있는 심볼들 확인
    const missingVolumeKeys: string[] = [];
    for (const [key, entry] of Object.entries(currentPrices)) {
      const e: any = entry;
      if (key.endsWith(':KRW') &&
          e.price > 0 &&
          (e.volume24hKrw === null || e.volume24hKrw === undefined || Number.isNaN(e.volume24hKrw))) {
        missingVolumeKeys.push(key);
      }
    }
    if (missingVolumeKeys.length > 0) {
      console.log(`[VOL-DEBUG] Missing volume24hKrw (${missingVolumeKeys.length}): ${missingVolumeKeys.slice(0, 10).join(', ')}${missingVolumeKeys.length > 10 ? '...' : ''}`);
    }

    savePrices(currentPrices);
    buildPremiumTable();

    const elapsed = Date.now() - startTime;
    console.log(`[Price] Updated in ${elapsed}ms (${priceCount} entries)`);
  } catch (err: any) {
    console.error('[Price] Update failed:', err.message);
  }
}

async function updateStatsOnly(): Promise<void> {
  const startTime = Date.now();
  const allMarkets = loadExchangeMarkets();
  // 빗썸은 KRW/BTC 마켓만 존재 (USDT 마켓 없음)
  const bithumbMarkets = filterMarkets(allMarkets, 'BITHUMB', ['KRW', 'BTC']);
  const coinoneMarkets = filterMarkets(allMarkets, 'COINONE', ['KRW']);
  const globalMarkets = getGlobalMarkets();

  try {
    const statsResults = await Promise.allSettled([
      fetchUpbitMarketStats(allMarkets),
      fetchBithumbStats(bithumbMarkets),
      fetchCoinoneStats(coinoneMarkets),
      fetchBinanceStats(globalMarkets),
      fetchBinanceFuturesStats(globalMarkets),
      fetchOkxStats(globalMarkets),
      fetchBybitStats(globalMarkets),
      fetchBitgetStats(globalMarkets),
      fetchGateStats(globalMarkets),
      fetchHtxStats(globalMarkets),
      fetchMexcStats(globalMarkets)
    ]);

    for (const result of statsResults) {
      if (result.status === 'fulfilled') {
        Object.assign(currentMarketStats, result.value);
      }
    }

    saveMarketStats(currentMarketStats);

    const elapsed = Date.now() - startTime;
    console.log(`[Stats] Updated in ${elapsed}ms (${Object.keys(currentMarketStats).length} stats)`);
  } catch (err: any) {
    console.error('[Stats] Update failed:', err.message);
  }
}

let priceCronJob: ReturnType<typeof cron.schedule> | null = null;
let statsCronJob: ReturnType<typeof cron.schedule> | null = null;
let isPriceUpdating = false;
let isStatsUpdating = false;

export function startPriceWorker(): void {
  console.log('[Worker] Starting price worker (3s) + stats worker (30s)');

  // Load previous health check state
  loadHealthCheck();

  updatePricesOnly();
  updateStatsOnly();

  priceCronJob = cron.schedule('*/3 * * * * *', async () => {
    if (isPriceUpdating) {
      return;
    }
    isPriceUpdating = true;
    try {
      await updatePricesOnly();
    } finally {
      isPriceUpdating = false;
    }
  });

  statsCronJob = cron.schedule('*/30 * * * * *', async () => {
    if (isStatsUpdating) {
      return;
    }
    isStatsUpdating = true;
    try {
      await updateStatsOnly();
    } finally {
      isStatsUpdating = false;
    }
  });
}

export function stopPriceWorker(): void {
  if (priceCronJob) {
    priceCronJob.stop();
    priceCronJob = null;
  }
  if (statsCronJob) {
    statsCronJob.stop();
    statsCronJob = null;
  }
  console.log('[Worker] Price and stats workers stopped');
}

if (require.main === module) {
  startPriceWorker();
}
