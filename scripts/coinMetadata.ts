export interface CoinMetadata {
  symbol: string;
  koreanName: string;
  englishName: string;
  cmcSlug?: string;
}

export interface DomesticMarkets {
  upbitKrw: string[];
  upbitBtc: string[];
  upbitUsdt: string[];
  bithumbKrw: string[];
  bithumbBtc: string[];
  coinoneKrw: string[];
}

let cachedMetadata: Map<string, CoinMetadata> = new Map();
let cachedMarkets: DomesticMarkets | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchUpbitMarkets(): Promise<{
  markets: { krw: string[]; btc: string[]; usdt: string[] };
  metadata: Map<string, CoinMetadata>;
}> {
  try {
    const response = await fetch('https://api.upbit.com/v1/market/all?isDetails=true');
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return { markets: { krw: [], btc: [], usdt: [] }, metadata: new Map() };
    }

    const krw: string[] = [];
    const btc: string[] = [];
    const usdt: string[] = [];
    const metadata = new Map<string, CoinMetadata>();

    for (const market of data) {
      const [quote, base] = market.market.split('-');
      
      if (!metadata.has(base)) {
        metadata.set(base, {
          symbol: base,
          koreanName: market.korean_name || base,
          englishName: market.english_name || base,
          cmcSlug: market.english_name?.toLowerCase().replace(/\s+/g, '-'),
        });
      }

      if (quote === 'KRW') krw.push(base);
      else if (quote === 'BTC') btc.push(base);
      else if (quote === 'USDT') usdt.push(base);
    }

    return { markets: { krw, btc, usdt }, metadata };
  } catch (error) {
    console.error('Upbit markets fetch error:', error);
    return { markets: { krw: [], btc: [], usdt: [] }, metadata: new Map() };
  }
}

export async function fetchBithumbMarkets(): Promise<{ krw: string[]; btc: string[] }> {
  try {
    const [krwRes, btcRes] = await Promise.all([
      fetch('https://api.bithumb.com/public/ticker/ALL_KRW'),
      fetch('https://api.bithumb.com/public/ticker/ALL_BTC'),
    ]);

    const krwData = await krwRes.json();
    const btcData = await btcRes.json();

    const krw: string[] = [];
    const btc: string[] = [];

    if (krwData.status === '0000' && krwData.data) {
      for (const symbol of Object.keys(krwData.data)) {
        if (symbol !== 'date') krw.push(symbol);
      }
    }

    if (btcData.status === '0000' && btcData.data) {
      for (const symbol of Object.keys(btcData.data)) {
        if (symbol !== 'date' && symbol !== 'BTC') btc.push(symbol);
      }
    }

    return { krw, btc };
  } catch (error) {
    console.error('Bithumb markets fetch error:', error);
    return { krw: [], btc: [] };
  }
}

export async function fetchCoinoneMarkets(): Promise<string[]> {
  try {
    const response = await fetch('https://api.coinone.co.kr/public/v2/ticker_new/krw');
    const data = await response.json();
    
    if (data.result !== 'success' || !data.tickers) return [];

    return data.tickers.map((t: any) => t.target_currency.toUpperCase());
  } catch (error) {
    console.error('Coinone markets fetch error:', error);
    return [];
  }
}

export async function getAllDomesticMarkets(): Promise<{
  markets: DomesticMarkets;
  metadata: Map<string, CoinMetadata>;
}> {
  const now = Date.now();
  if (cachedMarkets && cachedMetadata.size > 0 && now - lastFetchTime < CACHE_TTL) {
    return { markets: cachedMarkets, metadata: cachedMetadata };
  }

  const [upbitResult, bithumbResult, coinoneResult] = await Promise.all([
    fetchUpbitMarkets(),
    fetchBithumbMarkets(),
    fetchCoinoneMarkets(),
  ]);

  const markets: DomesticMarkets = {
    upbitKrw: upbitResult.markets.krw,
    upbitBtc: upbitResult.markets.btc,
    upbitUsdt: upbitResult.markets.usdt,
    bithumbKrw: bithumbResult.krw,
    bithumbBtc: bithumbResult.btc,
    coinoneKrw: coinoneResult,
  };

  cachedMarkets = markets;
  cachedMetadata = upbitResult.metadata;
  lastFetchTime = now;

  console.log(`[${new Date().toISOString()}] Loaded markets - Upbit KRW: ${markets.upbitKrw.length}, BTC: ${markets.upbitBtc.length}, USDT: ${markets.upbitUsdt.length} | Bithumb KRW: ${markets.bithumbKrw.length}, BTC: ${markets.bithumbBtc.length} | Coinone: ${markets.coinoneKrw.length}`);

  return { markets, metadata: cachedMetadata };
}

export function getCoinMetadata(symbol: string): CoinMetadata | undefined {
  return cachedMetadata.get(symbol);
}

export function getAllCoinMetadata(): Map<string, CoinMetadata> {
  return cachedMetadata;
}

export function getAllSymbols(): string[] {
  if (!cachedMarkets) return [];
  
  const allSymbols = new Set<string>();
  cachedMarkets.upbitKrw.forEach(s => allSymbols.add(s));
  cachedMarkets.bithumbKrw.forEach(s => allSymbols.add(s));
  cachedMarkets.coinoneKrw.forEach(s => allSymbols.add(s));
  
  return Array.from(allSymbols);
}
