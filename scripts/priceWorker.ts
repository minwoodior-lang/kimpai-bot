import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  exchange: string;
  market_symbol: string;
  base_symbol: string;
  quote_symbol: string;
  market_type?: string;
  is_active?: boolean;
}

interface PremiumRow {
  symbol: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  domesticExchange: string | null;
  foreignExchange: string | null;
}

const FX_DEFAULT = 1350;

function loadExchangeMarkets(): ExchangeMarket[] {
  const filePath = path.join(process.cwd(), "data", "exchange_markets.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return json as ExchangeMarket[];
}

async function fetchUpbitTicker(market: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.upbit.com/v1/ticker?markets=${market}`
    );
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBithumbTicker(market: string): Promise<any | null> {
  try {
    const [base, quote] = market.split("_");
    const { data } = await axios.get(
      `https://api.bithumb.com/public/ticker/${base}_${quote}`
    );
    return data?.data || null;
  } catch {
    return null;
  }
}

async function fetchCoinoneTicker(market: string): Promise<any | null> {
  try {
    const [base, quote] = market.split("-");
    const { data } = await axios.get(
      `https://api.coinone.co.kr/public/v2/ticker_utc0?currency=${base}&quote_currency=${quote}`
    );
    return data?.tickers?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBinanceTicker(
  symbol: string,
  isFutures = false
): Promise<any | null> {
  try {
    const endpoint = isFutures
      ? `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`
      : `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    const { data } = await axios.get(endpoint);
    return data;
  } catch {
    return null;
  }
}

async function fetchOkxTicker(instId: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://www.okx.com/api/v5/market/ticker?instId=${instId}`
    );
    return data?.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBybitTicker(symbol: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`
    );
    return data?.result?.list?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBitgetTicker(symbol: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.bitget.com/spot/v1/public/ticker?symbol=${symbol}`
    );
    return data?.data || null;
  } catch {
    return null;
  }
}

async function fetchGateTicker(symbol: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol}`
    );
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchHtxTicker(symbol: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.huobi.pro/market/detail/merged?symbol=${symbol}`
    );
    return data?.tick || null;
  } catch {
    return null;
  }
}

async function fetchMexcTicker(symbol: string): Promise<any | null> {
  try {
    const { data } = await axios.get(
      `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return data;
  } catch {
    return null;
  }
}

function extractPrice(data: any, exchange: string): number | null {
  if (!data) return null;

  switch (exchange) {
    case "UPBIT":
      return data.trade_price || null;
    case "BITHUMB":
      return Number(data.closing_price) || null;
    case "COINONE":
      return Number(data.last) || null;
    case "BINANCE":
    case "BINANCE_FUTURES":
    case "MEXC":
      return Number(data.price) || null;
    case "OKX":
      return Number(data.last) || null;
    case "BYBIT":
      return Number(data.lastPrice) || null;
    case "BITGET":
      return Number(data.last) || null;
    case "GATE":
      return Number(data.last) || null;
    case "HTX":
      return Number(data.close) || null;
    default:
      return null;
  }
}

async function main() {
  console.log("[priceWorker] 시작");

  try {
    const markets = loadExchangeMarkets().filter((m) => m.is_active ?? true);

    // 국내 거래소별 마켓 수집
    const upbitMarkets = markets.filter((m) => m.exchange === "UPBIT");
    const bithumbMarkets = markets.filter((m) => m.exchange === "BITHUMB");
    const coinoneMarkets = markets.filter((m) => m.exchange === "COINONE");

    // 해외 거래소별 마켓 수집
    const binanceMarkets = markets.filter((m) => m.exchange === "BINANCE");
    const binanceFuturesMarkets = markets.filter(
      (m) => m.exchange === "BINANCE_FUTURES"
    );
    const okxMarkets = markets.filter((m) => m.exchange === "OKX");
    const bybitMarkets = markets.filter((m) => m.exchange === "BYBIT");
    const bitgetMarkets = markets.filter((m) => m.exchange === "BITGET");
    const gateMarkets = markets.filter((m) => m.exchange === "GATE");
    const htxMarkets = markets.filter((m) => m.exchange === "HTX");
    const mexcMarkets = markets.filter((m) => m.exchange === "MEXC");

    const priceMap: Record<string, Record<string, number>> = {};

    // 업비트 시세
    for (const m of upbitMarkets) {
      const ticker = await fetchUpbitTicker(m.market_symbol);
      if (ticker) {
        const key = `UPBIT_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] = extractPrice(ticker, "UPBIT") || 0;
      }
    }

    // 빗썸 시세
    for (const m of bithumbMarkets) {
      const ticker = await fetchBithumbTicker(m.market_symbol);
      if (ticker) {
        const key = `BITHUMB_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "BITHUMB") || 0;
      }
    }

    // 코인원 시세
    for (const m of coinoneMarkets) {
      const ticker = await fetchCoinoneTicker(m.market_symbol);
      if (ticker) {
        const key = `COINONE_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "COINONE") || 0;
      }
    }

    // 바이낸스 USDT 시세
    for (const m of binanceMarkets) {
      const ticker = await fetchBinanceTicker(m.market_symbol);
      if (ticker) {
        const key = `BINANCE_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "BINANCE") || 0;
      }
    }

    // 바이낸스 선물 시세
    for (const m of binanceFuturesMarkets) {
      const ticker = await fetchBinanceTicker(m.market_symbol, true);
      if (ticker) {
        const key = `BINANCE_FUTURES_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "BINANCE_FUTURES") || 0;
      }
    }

    // OKX 시세
    for (const m of okxMarkets) {
      const ticker = await fetchOkxTicker(m.market_symbol);
      if (ticker) {
        const key = `OKX_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "OKX") || 0;
      }
    }

    // Bybit 시세
    for (const m of bybitMarkets) {
      const ticker = await fetchBybitTicker(m.market_symbol);
      if (ticker) {
        const key = `BYBIT_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "BYBIT") || 0;
      }
    }

    // Bitget 시세
    for (const m of bitgetMarkets) {
      const ticker = await fetchBitgetTicker(m.market_symbol);
      if (ticker) {
        const key = `BITGET_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "BITGET") || 0;
      }
    }

    // Gate.io 시세
    for (const m of gateMarkets) {
      const ticker = await fetchGateTicker(m.market_symbol);
      if (ticker) {
        const key = `GATE_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "GATE") || 0;
      }
    }

    // HTX 시세
    for (const m of htxMarkets) {
      const ticker = await fetchHtxTicker(m.market_symbol);
      if (ticker) {
        const key = `HTX_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "HTX") || 0;
      }
    }

    // MEXC 시세
    for (const m of mexcMarkets) {
      const ticker = await fetchMexcTicker(m.market_symbol);
      if (ticker) {
        const key = `MEXC_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] =
          extractPrice(ticker, "MEXC") || 0;
      }
    }

    // 프리미엄 계산 (기본값: 업비트 KRW vs OKX USDT)
    const rows: PremiumRow[] = [];

    for (const symbol in priceMap) {
      const prices = priceMap[symbol];
      const upbitKrw = prices.UPBIT_KRW || 0;
      const okxUsdt = prices.OKX_USDT || 0;

      let globalPriceKrw = okxUsdt * FX_DEFAULT;
      let premium = null;

      if (upbitKrw && globalPriceKrw) {
        premium = ((upbitKrw - globalPriceKrw) / globalPriceKrw) * 100;
      }

      rows.push({
        symbol,
        koreanPrice: upbitKrw || null,
        globalPrice: okxUsdt || null,
        globalPriceKrw: globalPriceKrw || null,
        premium,
        domesticExchange: "UPBIT",
        foreignExchange: "OKX",
      });

      console.log(
        `[${symbol}] 업비트 KRW: ${upbitKrw}, OKX USDT: ${okxUsdt}, 김프: ${premium?.toFixed(2) || "N/A"}%`
      );
    }

    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

    console.log(`[priceWorker] 완료: ${rows.length}개 코인`);
  } catch (error) {
    console.error("[priceWorker] 오류:", error);
    process.exit(1);
  }
}

main();
