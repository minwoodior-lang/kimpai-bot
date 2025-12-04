import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const PROXY_BASE = 'https://kimpai-price-proxy-1.onrender.com';

const EXCHANGE_APIS = {
  OKX: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
  BYBIT: `${PROXY_BASE}/bybit/v5/market/tickers?category=spot`,
  BITGET: 'https://api.bitget.com/api/v2/spot/market/tickers',
  GATE: 'https://api.gateio.ws/api/v4/spot/tickers',
  HTX: 'https://api.huobi.pro/market/tickers',
  MEXC: 'https://api.mexc.com/api/v3/ticker/price'
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
