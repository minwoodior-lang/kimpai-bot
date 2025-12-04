const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PRICE_CACHE_TTL = 2000;
const STATS_CACHE_TTL = 30000;
const cache = new Map();

function getCached(key, ttl = PRICE_CACHE_TTL) {
  const item = cache.get(key);
  if (item && Date.now() - item.ts < ttl) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

app.get('/', (req, res) => {
  res.json({ status: 'proxy-ok', timestamp: new Date().toISOString() });
});

app.get('/binance/api/v3/ticker/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    const cacheKey = 'binance_spot_all';

    let data = getCached(cacheKey, PRICE_CACHE_TTL);

    if (!data) {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      data = response.data;
      setCache(cacheKey, data);
    }

    if (symbol) {
      const filtered = data.find(x => x.symbol === symbol);
      return res.json(filtered || { symbol, price: '0' });
    }
    return res.json(data);
  } catch (error) {
    console.error('Binance spot proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Binance proxy failed' });
  }
});

app.get('/binance/fapi/v1/ticker/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    const cacheKey = 'binance_futures_all';

    let data = getCached(cacheKey, PRICE_CACHE_TTL);

    if (!data) {
      const response = await axios.get('https://fapi.binance.com/fapi/v1/ticker/price', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      data = response.data;
      setCache(cacheKey, data);
    }

    if (symbol) {
      const filtered = data.find(x => x.symbol === symbol);
      return res.json(filtered || { symbol, price: '0' });
    }
    return res.json(data);
  } catch (error) {
    console.error('Binance Futures proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Binance Futures proxy failed' });
  }
});

app.get('/binance/api/v3/ticker/24hr', async (req, res) => {
  try {
    const { symbol } = req.query;
    const cacheKey = 'binance_spot_24hr';

    let data = getCached(cacheKey, STATS_CACHE_TTL);

    if (!data) {
      console.log('[24hr] Fetching fresh data from Binance...');
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      data = response.data;
      setCache(cacheKey, data);
      console.log(`[24hr] Cached ${data.length} tickers for 30s`);
    }

    if (symbol) {
      const filtered = data.find(x => x.symbol === symbol);
      return res.json(filtered || null);
    }
    return res.json(data);
  } catch (error) {
    console.error('Binance 24hr proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Binance 24hr proxy failed' });
  }
});

app.get('/bybit/v5/market/tickers', async (req, res) => {
  try {
    const { category = 'spot', symbol } = req.query;
    const cacheKey = `bybit_${category}_all`;

    let data = getCached(cacheKey, PRICE_CACHE_TTL);

    if (!data) {
      const response = await axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      data = response.data;
      setCache(cacheKey, data);
    }

    if (symbol && data.result?.list) {
      const filtered = data.result.list.filter(x => x.symbol === symbol);
      return res.json({
        ...data,
        result: {
          ...data.result,
          list: filtered
        }
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Bybit proxy error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Bybit proxy failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KimpAI Proxy Server running on port ${PORT}`);
  console.log(`Price cache TTL: ${PRICE_CACHE_TTL}ms, Stats cache TTL: ${STATS_CACHE_TTL}ms`);
});
