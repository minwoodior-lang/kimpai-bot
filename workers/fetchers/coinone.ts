import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const COINONE_API = 'https://api.coinone.co.kr/public/v2/ticker_new/KRW';

// 코인원 전용 axios 인스턴스 (최고 성능 연결 풀링)
const coinoneInstance = axios.create({
  timeout: 2000,
  httpAgent: new (require('http').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 })
});

async function fetchCoinoneData(retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await coinoneInstance.get(COINONE_API);
      if (res.data.result === 'success') {
        return res.data;
      }
    } catch (err: any) {
      if (attempt === retries) {
        console.error('[Coinone] Fetch error:', err.message);
        return null;
      }
      // 재시도 전 50ms 대기
      await new Promise(r => setTimeout(r, 50));
    }
  }
  return null;
}

export async function fetchCoinonePrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const data = await fetchCoinoneData();
  if (!data) return {};

  const prices: PriceMap = {};
  const ts = Date.now();
  const tickers = data.tickers || [];
  const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

  for (const ticker of tickers) {
    const base = ticker.target_currency?.toUpperCase();
    if (base && marketBases.has(base) && ticker.last) {
      const key = `COINONE:${base}:KRW`;
      const lastPrice = parseFloat(ticker.last);
      const prevPrice = parseFloat(ticker.yesterday_last) || 0;
      const baseVol = Number(ticker.target_volume);
      const quoteVol = Number(ticker.quote_volume);
      let volume24hKrw: number | null = null;
      if (Number.isFinite(quoteVol) && quoteVol > 0) {
        volume24hKrw = quoteVol;
      } else if (Number.isFinite(baseVol) && baseVol > 0 && Number.isFinite(lastPrice) && lastPrice > 0) {
        volume24hKrw = baseVol * lastPrice;
      }
      const change24hAbs = lastPrice - prevPrice;
      const change24hRate = prevPrice > 0 ? (change24hAbs / prevPrice) * 100 : 0;
      prices[key] = {
        price: lastPrice,
        ts,
        volume24hKrw,
        change24hRate,
        change24hAbs,
        high24h: parseFloat(ticker.high) || undefined,
        low24h: parseFloat(ticker.low) || undefined,
        prev_price: prevPrice || undefined
      };
    }
  }

  return prices;
}

export async function fetchCoinoneStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};

  const data = await fetchCoinoneData();
  if (!data) return {};

  const stats: MarketStatsMap = {};
  const tickers = data.tickers || [];
  const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

  for (const ticker of tickers) {
    const base = ticker.target_currency?.toUpperCase();
    if (base && marketBases.has(base)) {
      const lastPrice = parseFloat(ticker.last) || 0;
      const yesterdayLast = parseFloat(ticker.yesterday_last) || 0;
      const change24hAbs = lastPrice - yesterdayLast;
      const change24hRate = yesterdayLast > 0 ? (change24hAbs / yesterdayLast) * 100 : 0;

      const key = `COINONE:${base}:KRW`;
      
      let volume24hQuote = parseFloat(ticker.quote_volume) || 0;
      if (volume24hQuote === 0 && ticker.target_volume && ticker.last) {
        volume24hQuote = parseFloat(ticker.target_volume) * parseFloat(ticker.last);
      }
      
      stats[key] = {
        change24hRate,
        change24hAbs,
        high24h: parseFloat(ticker.high) || null,
        low24h: parseFloat(ticker.low) || null,
        volume24hQuote
      };
    }
  }

  return stats;
}
