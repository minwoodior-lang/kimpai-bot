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
  type MarketInfo,
  type PriceMap
} from './fetchers';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const PREMIUM_TABLE_FILE = path.join(DATA_DIR, 'premiumTable.json');
const EXCHANGE_MARKETS_FILE = path.join(DATA_DIR, 'exchange_markets.json');
const MASTER_SYMBOLS_FILE = path.join(DATA_DIR, 'master_symbols.json');
const MARKET_STATS_FILE = path.join(DATA_DIR, 'marketStats.json');

interface MarketStatsEntry {
  change24h: number;
  high24h: number | null;
  low24h: number | null;
  volume24hKrw: number;
}

type MarketStatsMap = Record<string, MarketStatsEntry>;

let currentPrices: PriceMap = {};
let currentMarketStats: MarketStatsMap = {};
let usdKrwRate = 1380;
let lastFxUpdate = 0;

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

async function updateFxRate(): Promise<void> {
  const now = Date.now();
  if (now - lastFxUpdate < 300000) return;

  try {
    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 5000 });
    usdKrwRate = res.data.rates?.KRW || 1380;
    lastFxUpdate = now;
    console.log(`[FX] USD/KRW updated: ${usdKrwRate}`);
  } catch {
    console.warn('[FX] Failed to update, using cached rate:', usdKrwRate);
  }
}

function filterMarkets(markets: MarketInfo[], exchange: string, quotes: string[]): MarketInfo[] {
  return markets.filter(m => 
    m.exchange === exchange && quotes.includes(m.quote)
  );
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
  
  const upbitKrwMarkets = markets
    .filter(m => m.exchange === 'UPBIT' && m.quote === 'KRW')
    .map(m => m.market);

  if (upbitKrwMarkets.length === 0) return result;

  const chunkSize = 80;
  const chunks: string[][] = [];
  
  for (let i = 0; i < upbitKrwMarkets.length; i += chunkSize) {
    chunks.push(upbitKrwMarkets.slice(i, i + chunkSize));
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
          change24h: (ticker.signed_change_rate ?? 0) * 100,
          high24h: ticker.high_price ?? null,
          low24h: ticker.low_price ?? null,
          volume24hKrw: ticker.acc_trade_price_24h ?? 0
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

    premiumRows.push({
      symbol,
      name_ko: master.name_ko || symbol,
      name_en: master.name_en || symbol,
      koreanPrice: koreanPrice || 0,
      globalPrice: globalPrice || 0,
      premium: Math.round(premium * 100) / 100,
      usdKrw: usdKrwRate,
      iconUrl: master.icon_path || null,
      cmcSlug: master.cmc_slug || null,
      updatedAt: Date.now()
    });
  }

  premiumRows.sort((a, b) => b.premium - a.premium);

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

function getGlobalPrice(symbol: string): number | null {
  const priority = ['BINANCE', 'BINANCE_FUTURES', 'OKX', 'BYBIT', 'BITGET', 'GATE', 'HTX', 'MEXC'];
  for (const ex of priority) {
    const key = `${ex}:${symbol}:USDT`;
    if (currentPrices[key]) {
      return currentPrices[key].price;
    }
  }
  return null;
}

async function updatePrices(): Promise<void> {
  const startTime = Date.now();
  const allMarkets = loadExchangeMarkets();

  await updateFxRate();

  const upbitMarkets = filterMarkets(allMarkets, 'UPBIT', ['KRW', 'BTC', 'USDT']);
  const bithumbMarkets = filterMarkets(allMarkets, 'BITHUMB', ['KRW', 'BTC', 'USDT']);
  const coinoneMarkets = filterMarkets(allMarkets, 'COINONE', ['KRW']);

  const globalBases = new Set([...upbitMarkets, ...bithumbMarkets, ...coinoneMarkets].map(m => m.base.toUpperCase()));
  const globalMarkets: MarketInfo[] = Array.from(globalBases).map(base => ({
    id: `GLOBAL:${base}:USDT`,
    exchange: 'GLOBAL',
    market: `${base}USDT`,
    base,
    quote: 'USDT'
  }));

  try {
    const [priceResults, statsResult] = await Promise.all([
      Promise.allSettled([
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
      ]),
      fetchUpbitMarketStats(allMarkets)
    ]);

    for (const result of priceResults) {
      if (result.status === 'fulfilled') {
        Object.assign(currentPrices, result.value);
      }
    }

    Object.assign(currentMarketStats, statsResult);

    savePrices(currentPrices);
    saveMarketStats(currentMarketStats);
    buildPremiumTable();

    const elapsed = Date.now() - startTime;
    console.log(`[Worker] Prices updated in ${elapsed}ms (${Object.keys(currentPrices).length} entries, ${Object.keys(currentMarketStats).length} stats)`);
  } catch (err: any) {
    console.error('[Worker] Update failed:', err.message);
  }
}

let cronJob: ReturnType<typeof cron.schedule> | null = null;
let isUpdating = false;

export function startPriceWorker(): void {
  console.log('[Worker] Starting price worker (3s interval)');

  updatePrices();

  cronJob = cron.schedule('*/3 * * * * *', async () => {
    if (isUpdating) {
      console.log('[Worker] Skipping tick - previous update still running');
      return;
    }
    isUpdating = true;
    try {
      await updatePrices();
    } finally {
      isUpdating = false;
    }
  });
}

export function stopPriceWorker(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Worker] Price worker stopped');
  }
}

if (require.main === module) {
  startPriceWorker();
}
