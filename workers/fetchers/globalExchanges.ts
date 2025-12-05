import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const PROXY_BASE = 'https://kimpai-price-proxy-1.onrender.com';
let usdKrwRate = 1450;

const EXCHANGE_APIS = {
  OKX: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  BYBIT: `${PROXY_BASE}/bybit/v5/market/tickers?category=spot`,
  BITGET: 'https://api.bitget.com/api/v2/spot/market/tickers',
  GATE: 'https://api.gateio.ws/api/v4/spot/tickers',
  HTX: 'https://api.huobi.pro/market/tickers',
  MEXC: 'https://api.mexc.com/api/v3/ticker/price',
  MEXC_24HR: 'https://api.mexc.com/api/v3/ticker/24hr'
};

export function setGlobalUsdKrwRate(rate: number): void {
  usdKrwRate = rate;
}

export async function fetchOkxPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.OKX, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.data || []) {
      const [base, quote] = item.instId.split('-');
      if (quote === 'USDT' && marketBases.has(base)) {
        const lastPrice = parseFloat(item.last) || 0;
        const open24h = parseFloat(item.open24h) || 0;
        const volCcy24h = parseFloat(item.volCcy24h) || 0;
        prices[`OKX:${base}:USDT`] = {
          price: lastPrice,
          ts,
          volume24hKrw: volCcy24h * usdKrwRate,
          volume24hQuote: volCcy24h,
          change24hRate: open24h > 0 ? ((lastPrice - open24h) / open24h) * 100 : 0,
          change24hAbs: lastPrice - open24h,
          high24h: parseFloat(item.high24h) || undefined,
          low24h: parseFloat(item.low24h) || undefined,
          prev_price: open24h || undefined
        };
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[OKX] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBybitPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.BYBIT, { timeout: 15000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.result?.list || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const prevPrice = parseFloat(item.prevPrice24h) || 0;
          const turnover24h = parseFloat(item.turnover24h) || 0;
          prices[`BYBIT:${base}:USDT`] = {
            price: lastPrice,
            ts,
            volume24hKrw: turnover24h * usdKrwRate,
            volume24hQuote: turnover24h,
            change24hRate: (parseFloat(item.price24hPcnt) || 0) * 100,
            change24hAbs: lastPrice - prevPrice,
            high24h: parseFloat(item.highPrice24h) || undefined,
            low24h: parseFloat(item.lowPrice24h) || undefined,
            prev_price: prevPrice || undefined
          };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[Bybit] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBitgetPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.BITGET, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPr) || 0;
          const open = parseFloat(item.open) || 0;
          const quoteVolume = parseFloat(item.quoteVolume) || 0;
          prices[`BITGET:${base}:USDT`] = {
            price: lastPrice,
            ts,
            volume24hKrw: quoteVolume * usdKrwRate,
            volume24hQuote: quoteVolume,
            change24hRate: open > 0 ? ((lastPrice - open) / open) * 100 : 0,
            change24hAbs: lastPrice - open,
            high24h: parseFloat(item.high24h) || undefined,
            low24h: parseFloat(item.low24h) || undefined,
            prev_price: open || undefined
          };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[Bitget] Fetch error:', err.message);
    return {};
  }
}

export async function fetchGatePrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.GATE, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const pair = item.currency_pair;
      if (pair.endsWith('_USDT')) {
        const base = pair.replace('_USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.last) || 0;
          const open = parseFloat(item.open) || 0;
          const quoteVolume = parseFloat(item.quote_volume) || 0;
          prices[`GATE:${base}:USDT`] = {
            price: lastPrice,
            ts,
            volume24hKrw: quoteVolume * usdKrwRate,
            volume24hQuote: quoteVolume,
            change24hRate: open > 0 ? ((lastPrice - open) / open) * 100 : 0,
            change24hAbs: lastPrice - open,
            high24h: parseFloat(item.high) || undefined,
            low24h: parseFloat(item.low) || undefined,
            prev_price: open || undefined
          };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[Gate] Fetch error:', err.message);
    return {};
  }
}

export async function fetchHtxPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.HTX, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toLowerCase()));

    for (const item of res.data.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('usdt')) {
        const base = symbol.replace('usdt', '').toUpperCase();
        if (marketBases.has(base.toLowerCase())) {
          const lastPrice = parseFloat(item.close) || 0;
          const open = parseFloat(item.open) || 0;
          const amount = parseFloat(item.amount) || 0;
          prices[`HTX:${base}:USDT`] = {
            price: lastPrice,
            ts,
            volume24hKrw: amount * usdKrwRate,
            volume24hQuote: amount,
            change24hRate: open > 0 ? ((lastPrice - open) / open) * 100 : 0,
            change24hAbs: lastPrice - open,
            high24h: parseFloat(item.high) || undefined,
            low24h: parseFloat(item.low) || undefined,
            prev_price: open || undefined
          };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[HTX] Fetch error:', err.message);
    return {};
  }
}

export async function fetchMexcPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.MEXC_24HR, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const openPrice = parseFloat(item.openPrice) || 0;
          const quoteVolume = parseFloat(item.quoteVolume) || 0;
          prices[`MEXC:${base}:USDT`] = {
            price: lastPrice,
            ts,
            volume24hKrw: quoteVolume * usdKrwRate,
            volume24hQuote: quoteVolume,
            change24hRate: openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : 0,
            change24hAbs: lastPrice - openPrice,
            high24h: parseFloat(item.highPrice) || undefined,
            low24h: parseFloat(item.lowPrice) || undefined,
            prev_price: openPrice || undefined
          };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[MEXC] Fetch error:', err.message);
    return {};
  }
}

// Stats fetchers - 계속해서 호환성 유지
export async function fetchOkxStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.OKX, { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.data || []) {
      const [base, quote] = item.instId.split('-');
      if (quote === 'USDT' && marketBases.has(base)) {
        const lastPrice = parseFloat(item.last) || 0;
        const open24h = parseFloat(item.open24h) || 0;
        const change24hAbs = lastPrice - open24h;
        const change24hRate = open24h > 0 ? (change24hAbs / open24h) * 100 : 0;

        stats[`OKX:${base}:USDT`] = {
          change24hRate,
          change24hAbs,
          high24h: parseFloat(item.high24h) || null,
          low24h: parseFloat(item.low24h) || null,
          volume24hQuote: parseFloat(item.volCcy24h) || 0
        };
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[OKX Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBybitStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.BYBIT, { timeout: 15000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.result?.list || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const prevPrice = parseFloat(item.prevPrice24h) || 0;
          const change24hAbs = lastPrice - prevPrice;

          stats[`BYBIT:${base}:USDT`] = {
            change24hRate: parseFloat(item.price24hPcnt) * 100 || 0,
            change24hAbs,
            high24h: parseFloat(item.highPrice24h) || null,
            low24h: parseFloat(item.lowPrice24h) || null,
            volume24hQuote: parseFloat(item.turnover24h) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[Bybit Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBitgetStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.BITGET, { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPr) || 0;
          const open = parseFloat(item.open) || 0;
          const change24hAbs = lastPrice - open;
          const change24hRate = open > 0 ? (change24hAbs / open) * 100 : 0;

          stats[`BITGET:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.high24h) || null,
            low24h: parseFloat(item.low24h) || null,
            volume24hQuote: parseFloat(item.quoteVolume) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[Bitget Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchGateStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.GATE, { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const pair = item.currency_pair;
      if (pair.endsWith('_USDT')) {
        const base = pair.replace('_USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.last) || 0;
          const open = parseFloat(item.open) || 0;
          const change24hAbs = lastPrice - open;
          const change24hRate = open > 0 ? (change24hAbs / open) * 100 : 0;

          stats[`GATE:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.high) || null,
            low24h: parseFloat(item.low) || null,
            volume24hQuote: parseFloat(item.quote_volume) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[Gate Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchHtxStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.HTX, { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toLowerCase()));

    for (const item of res.data.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('usdt')) {
        const base = symbol.replace('usdt', '').toUpperCase();
        if (marketBases.has(base.toLowerCase())) {
          const lastPrice = parseFloat(item.close) || 0;
          const open = parseFloat(item.open) || 0;
          const change24hAbs = lastPrice - open;
          const change24hRate = open > 0 ? (change24hAbs / open) * 100 : 0;

          stats[`HTX:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.high) || null,
            low24h: parseFloat(item.low) || null,
            volume24hQuote: parseFloat(item.amount) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[HTX Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchMexcStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get(EXCHANGE_APIS.MEXC_24HR, { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const openPrice = parseFloat(item.openPrice) || 0;
          const change24hAbs = lastPrice - openPrice;
          const change24hRate = openPrice > 0 ? (change24hAbs / openPrice) * 100 : 0;

          stats[`MEXC:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.highPrice) || null,
            low24h: parseFloat(item.lowPrice) || null,
            volume24hQuote: parseFloat(item.quoteVolume) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[MEXC Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBinanceSpotStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr', { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const openPrice = parseFloat(item.openPrice) || 0;
          const change24hAbs = lastPrice - openPrice;
          const change24hRate = openPrice > 0 ? (change24hAbs / openPrice) * 100 : 0;

          stats[`BINANCE:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.highPrice) || null,
            low24h: parseFloat(item.lowPrice) || null,
            volume24hQuote: parseFloat(item.quoteAssetVolume) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[Binance Spot Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBinanceFuturesStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};
  try {
    const res = await axios.get('https://fapi.binance.com/fapi/v1/ticker/24hr', { timeout: 5000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const lastPrice = parseFloat(item.lastPrice) || 0;
          const openPrice = parseFloat(item.openPrice) || 0;
          const change24hAbs = lastPrice - openPrice;
          const change24hRate = openPrice > 0 ? (change24hAbs / openPrice) * 100 : 0;

          stats[`BINANCE_FUTURES:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.highPrice) || null,
            low24h: parseFloat(item.lowPrice) || null,
            volume24hQuote: parseFloat(item.quoteAssetVolume) || 0
          };
        }
      }
    }
    return stats;
  } catch (err: any) {
    console.error('[Binance Futures Stats] Fetch error:', err.message);
    return {};
  }
}
