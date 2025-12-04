/**
 * 메타 자동 동기화 스크립트 (sync:meta)
 * 
 * 1) exchange_markets.json에서 모든 심볼 추출
 * 2) 아이콘 없으면 CoinGecko API에서 자동 다운로드
 * 3) CMC slug 검색 및 자동 매핑
 * 4) 기본 TradingView 심볼 자동 생성
 * 5) master_symbols.json에 병합 저장
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'data');
const ICONS_DIR = path.join(process.cwd(), 'public', 'icons', 'coins');
const EXCHANGE_MARKETS_FILE = path.join(DATA_DIR, 'exchange_markets.json');
const MASTER_SYMBOLS_FILE = path.join(DATA_DIR, 'master_symbols.json');
const CMC_SLUGS_FILE = path.join(DATA_DIR, 'cmc_slugs.json');

interface ExchangeMarket {
  id: string;
  exchange: string;
  market: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  isDomestic: boolean;
}

interface MasterSymbol {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  cmcSlug?: string;
  tradingViewSymbol?: string;
  iconUrl?: string;
  updatedAt: number;
}

interface CmcSlugMap {
  [symbol: string]: string;
}

function loadExchangeMarkets(): ExchangeMarket[] {
  try {
    return JSON.parse(fs.readFileSync(EXCHANGE_MARKETS_FILE, 'utf-8'));
  } catch {
    console.error('[SyncMeta] Failed to load exchange_markets.json');
    return [];
  }
}

function loadMasterSymbols(): MasterSymbol[] {
  try {
    return JSON.parse(fs.readFileSync(MASTER_SYMBOLS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function loadCmcSlugs(): CmcSlugMap {
  try {
    return JSON.parse(fs.readFileSync(CMC_SLUGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveMasterSymbols(symbols: MasterSymbol[]): void {
  const tmpFile = MASTER_SYMBOLS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(symbols, null, 2), 'utf-8');
  fs.renameSync(tmpFile, MASTER_SYMBOLS_FILE);
}

function saveCmcSlugs(slugs: CmcSlugMap): void {
  const tmpFile = CMC_SLUGS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(slugs, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CMC_SLUGS_FILE);
}

function generateTradingViewSymbol(symbol: string): string {
  const binanceSymbol = `BINANCE:${symbol}USDT`;
  return binanceSymbol;
}

function checkIconExists(symbol: string): boolean {
  const iconPath = path.join(ICONS_DIR, `${symbol}.png`);
  return fs.existsSync(iconPath);
}

async function fetchCoinGeckoIcon(symbol: string): Promise<string | null> {
  try {
    const symbolLower = symbol.toLowerCase();
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${symbolLower}`;
    
    const searchRes = await axios.get(searchUrl, { timeout: 5000 });
    const coins = searchRes.data?.coins || [];
    
    const exactMatch = coins.find((c: any) => 
      c.symbol?.toLowerCase() === symbolLower
    );
    
    if (exactMatch?.thumb) {
      return exactMatch.thumb.replace('/thumb/', '/large/');
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

async function downloadIcon(symbol: string, url: string): Promise<boolean> {
  try {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const iconPath = path.join(ICONS_DIR, `${symbol}.png`);
    fs.writeFileSync(iconPath, response.data);
    
    return true;
  } catch (err) {
    return false;
  }
}

async function fetchCmcSlug(symbol: string): Promise<string | null> {
  const knownSlugs: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'XRP': 'xrp',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'TRX': 'tron',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'DOT': 'polkadot',
    'MATIC': 'polygon',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'ATOM': 'cosmos',
    'ETC': 'ethereum-classic',
    'FIL': 'filecoin',
    'VET': 'vechain',
    'NEAR': 'near-protocol',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism-ethereum',
    'SUI': 'sui',
    'SEI': 'sei-network',
    'INJ': 'injective-protocol',
    'RENDER': 'render-token',
    'FET': 'fetch-ai',
    'IMX': 'immutable-x',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'AXS': 'axie-infinity',
    'GALA': 'gala',
    'ENS': 'ethereum-name-service',
    'AAVE': 'aave',
    'MKR': 'maker',
    'CRV': 'curve-dao-token',
    'SNX': 'synthetix-network-token',
    'COMP': 'compound',
    'UNI': 'uniswap',
    'SUSHI': 'sushi',
    '1INCH': '1inch',
    'PEPE': 'pepe',
    'WIF': 'dogwifcoin',
    'BONK': 'bonk',
    'FLOKI': 'floki-inu',
    'USDT': 'tether',
    'USDC': 'usd-coin',
  };
  
  if (knownSlugs[symbol]) {
    return knownSlugs[symbol];
  }
  
  return null;
}

async function syncMeta() {
  console.log('[SyncMeta] Starting metadata synchronization...');
  
  const markets = loadExchangeMarkets();
  const existingSymbols = loadMasterSymbols();
  const cmcSlugs = loadCmcSlugs();
  
  const domesticMarkets = markets.filter(m => m.isDomestic);
  const uniqueSymbols = Array.from(new Set(domesticMarkets.map(m => m.base)));
  
  console.log(`[SyncMeta] Found ${uniqueSymbols.length} unique symbols from domestic exchanges`);
  
  const symbolMap = new Map<string, MasterSymbol>();
  for (const s of existingSymbols) {
    symbolMap.set(s.symbol, s);
  }
  
  const nameMap = new Map<string, { ko?: string; en?: string }>();
  for (const m of domesticMarkets) {
    if (!nameMap.has(m.base)) {
      nameMap.set(m.base, {});
    }
    const entry = nameMap.get(m.base)!;
    if (m.name_ko && !entry.ko) entry.ko = m.name_ko;
    if (m.name_en && !entry.en) entry.en = m.name_en;
  }
  
  let newSymbols = 0;
  let updatedSymbols = 0;
  let iconsFetched = 0;
  let cmcMapped = 0;
  
  for (const symbol of uniqueSymbols) {
    const existing = symbolMap.get(symbol);
    const names = nameMap.get(symbol) || {};
    
    const now = Date.now();
    
    if (!existing) {
      const cmcSlug = cmcSlugs[symbol] || await fetchCmcSlug(symbol);
      if (cmcSlug && !cmcSlugs[symbol]) {
        cmcSlugs[symbol] = cmcSlug;
        cmcMapped++;
      }
      
      const newEntry: MasterSymbol = {
        symbol,
        name_ko: names.ko,
        name_en: names.en,
        cmcSlug: cmcSlug || undefined,
        tradingViewSymbol: generateTradingViewSymbol(symbol),
        iconUrl: `/icons/coins/${symbol}.png`,
        updatedAt: now,
      };
      
      symbolMap.set(symbol, newEntry);
      newSymbols++;
    } else {
      let updated = false;
      
      if (!existing.name_ko && names.ko) {
        existing.name_ko = names.ko;
        updated = true;
      }
      if (!existing.name_en && names.en) {
        existing.name_en = names.en;
        updated = true;
      }
      
      if (!existing.cmcSlug) {
        const cmcSlug = cmcSlugs[symbol] || await fetchCmcSlug(symbol);
        if (cmcSlug) {
          existing.cmcSlug = cmcSlug;
          if (!cmcSlugs[symbol]) {
            cmcSlugs[symbol] = cmcSlug;
            cmcMapped++;
          }
          updated = true;
        }
      }
      
      if (!existing.tradingViewSymbol) {
        existing.tradingViewSymbol = generateTradingViewSymbol(symbol);
        updated = true;
      }
      
      if (!existing.iconUrl) {
        existing.iconUrl = `/icons/coins/${symbol}.png`;
        updated = true;
      }
      
      if (updated) {
        existing.updatedAt = now;
        updatedSymbols++;
      }
    }
  }
  
  const finalSymbols = Array.from(symbolMap.values())
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  
  saveMasterSymbols(finalSymbols);
  saveCmcSlugs(cmcSlugs);
  
  console.log(`[SyncMeta] Complete:`);
  console.log(`  - Total symbols: ${finalSymbols.length}`);
  console.log(`  - New symbols: ${newSymbols}`);
  console.log(`  - Updated symbols: ${updatedSymbols}`);
  console.log(`  - CMC slugs mapped: ${cmcMapped}`);
}

syncMeta()
  .then(() => {
    console.log('[SyncMeta] Finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[SyncMeta] Error:', err);
    process.exit(1);
  });
