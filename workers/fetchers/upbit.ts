import axios from 'axios';
import pLimit from 'p-limit';
import type { MarketInfo, PriceMap } from './types';

const UPBIT_API = 'https://api.upbit.com/v1/ticker';

// 업빗 전용 axios 인스턴스 (최고 성능 연결 풀링)
const upbitInstance = axios.create({
  timeout: 2000,
  httpAgent: new (require('http').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 })
});

// 청크 크기 최적화 (200개 단위로 Rate Limit 회피)
const CHUNK_SIZE = 200;
// 동시 청크 요청 제한 (2개씩만 동시)
const limit = pLimit(2);

async function fetchUpbitChunk(marketCodes: string[], retries = 1): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await upbitInstance.get(UPBIT_API, {
        params: { markets: marketCodes.join(',') }
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err: any) {
      if (attempt === retries) {
        return [];
      }
      // 재시도 전 100ms 대기
      await new Promise(r => setTimeout(r, 100));
    }
  }
  return [];
}

export async function fetchUpbitPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const marketCodes = markets.map(m => `${m.quote}-${m.base}`);
  const chunks: string[][] = [];
  
  // 청크로 분할
  for (let i = 0; i < marketCodes.length; i += CHUNK_SIZE) {
    chunks.push(marketCodes.slice(i, i + CHUNK_SIZE));
  }

  // 청크를 동시에 2개씩 요청 (Rate Limit 회피)
  const results = await Promise.all(
    chunks.map(chunk => limit(() => fetchUpbitChunk(chunk)))
  );
  
  const prices: PriceMap = {};
  const ts = Date.now();

  // 결과 병합
  for (const result of results) {
    for (const item of result) {
      const [quote, base] = item.market.split('-');
      const key = `UPBIT:${base}:${quote}`;
      const accTradePrice24h = Number(item.acc_trade_price_24h);
      prices[key] = {
        price: item.trade_price,
        ts,
        volume24hKrw: Number.isFinite(accTradePrice24h) ? accTradePrice24h : null,
        change24hRate: (item.signed_change_rate ?? 0) * 100,
        change24hAbs: item.signed_change_price ?? 0,
        high24h: item.high_price ?? undefined,
        low24h: item.low_price ?? undefined,
        prev_price: item.prev_closing_price ?? undefined
      };
    }
  }

  return prices;
}
