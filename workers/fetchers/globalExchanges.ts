import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const PROXY_BASE = 'https://kimpai-price-proxy-1.onrender.com';

const EXCHANGE_APIS = {
  OKX: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  BYBIT: `${PROXY_BASE}/bybit/v5/market/tickers?category=spot`,
  BITGET: 'https://api.bitget.com/api/v2/spot/market/tickers',
  GATE: 'https://api.gateio.ws/api/v4/spot/tickers',
  HTX: 'https://api.huobi.pro/market/tickers',
  MEXC: 'https://api.mexc.com/api/v3/ticker/price',
  MEXC_24HR: 'https://api.mexc.com/api/v3/ticker/24hr'
};

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
        prices[`OKX:${base}:USDT`] = { price: parseFloat(item.last), ts };
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
          prices[`BYBIT:${base}:USDT`] = { price: parseFloat(item.lastPrice), ts };
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
          prices[`BITGET:${base}:USDT`] = { price: parseFloat(item.lastPr), ts };
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
          prices[`GATE:${base}:USDT`] = { price: parseFloat(item.last), ts };
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
          prices[`HTX:${base}:USDT`] = { price: parseFloat(item.close), ts };
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
    const res = await axios.get(EXCHANGE_APIS.MEXC, { timeout: 5000 });
    const prices: PriceMap = {};
    const ts = Date.now();
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data || []) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          prices[`MEXC:${base}:USDT`] = { price: parseFloat(item.price), ts };
        }
      }
    }
    return prices;
  } catch (err: any) {
    console.error('[MEXC] Fetch error:', err.message);
    return {};
  }
}

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
          stats[`GATE:${base}:USDT`] = {
            change24hRate: parseFloat(item.change_percentage) || 0,
            change24hAbs: parseFloat(item.change_utc0) || 0,
            high24h: parseFloat(item.high_24h) || null,
            low24h: parseFloat(item.low_24h) || null,
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
          const closePrice = parseFloat(item.close) || 0;
          const openPrice = parseFloat(item.open) || 0;
          const change24hAbs = closePrice - openPrice;
          const change24hRate = openPrice > 0 ? (change24hAbs / openPrice) * 100 : 0;

          stats[`HTX:${base}:USDT`] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.high) || null,
            low24h: parseFloat(item.low) || null,
            volume24hQuote: parseFloat(item.vol) || 0
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
          stats[`MEXC:${base}:USDT`] = {
            change24hRate: parseFloat(item.priceChangePercent) || 0,
            change24hAbs: parseFloat(item.priceChange) || 0,
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
