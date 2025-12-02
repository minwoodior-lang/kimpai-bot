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

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      return data;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function fetchUpbitTickers(markets: string[]): Promise<Record<string, any>> {
  try {
    if (!markets.length) return {};
    const data = await fetchWithRetry(
      `https://api.upbit.com/v1/ticker?markets=${markets.join(",")}`
    );
    const result: Record<string, any> = {};
    for (const row of data) result[row.market] = row;
    return result;
  } catch {
    return {};
  }
}

async function fetchBithumbTicker(market: string): Promise<any | null> {
  try {
    const [base, quote] = market.split("_");
    const data = await fetchWithRetry(
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
    const data = await fetchWithRetry(
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
    const data = await fetchWithRetry(endpoint);
    return data;
  } catch {
    return null;
  }
}

async function fetchOkxTicker(instId: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
      `https://www.okx.com/api/v5/market/ticker?instId=${instId}`
    );
    return data?.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBybitTicker(symbol: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`
    );
    return data?.result?.list?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchBitgetTicker(symbol: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
      `https://api.bitget.com/spot/v1/public/ticker?symbol=${symbol}`
    );
    return data?.data || null;
  } catch {
    return null;
  }
}

async function fetchGateTicker(symbol: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
      `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol}`
    );
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchHtxTicker(symbol: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
      `https://api.huobi.pro/market/detail/merged?symbol=${symbol}`
    );
    return data?.tick || null;
  } catch {
    return null;
  }
}

async function fetchMexcTicker(symbol: string): Promise<any | null> {
  try {
    const data = await fetchWithRetry(
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

    // 거래소별 마켓 분류
    const upbitMarkets = markets.filter((m) => m.exchange === "UPBIT");
    const bithumbMarkets = markets.filter((m) => m.exchange === "BITHUMB");
    const coinoneMarkets = markets.filter((m) => m.exchange === "COINONE");
    const binanceMarkets = markets.filter((m) => m.exchange === "BINANCE");
    const binanceFuturesMarkets = markets.filter((m) => m.exchange === "BINANCE_FUTURES");
    const okxMarkets = markets.filter((m) => m.exchange === "OKX");
    const bybitMarkets = markets.filter((m) => m.exchange === "BYBIT");
    const bitgetMarkets = markets.filter((m) => m.exchange === "BITGET");
    const gateMarkets = markets.filter((m) => m.exchange === "GATE");
    const htxMarkets = markets.filter((m) => m.exchange === "HTX");
    const mexcMarkets = markets.filter((m) => m.exchange === "MEXC");

    const priceMap: Record<string, Record<string, number>> = {};

    // Upbit 배치 처리
    const upbitSymbols = upbitMarkets.map((m) => m.market_symbol);
    const upbitTickers = await fetchUpbitTickers(upbitSymbols);
    for (const m of upbitMarkets) {
      const ticker = upbitTickers[m.market_symbol];
      if (ticker) {
        const key = `UPBIT_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] = extractPrice(ticker, "UPBIT") || 0;
      }
    }

    // Bithumb 순차 처리
    for (const m of bithumbMarkets) {
      const ticker = await fetchBithumbTicker(m.market_symbol);
      if (ticker) {
        const key = `BITHUMB_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] = extractPrice(ticker, "BITHUMB") || 0;
      }
    }

    // Coinone 순차 처리
    for (const m of coinoneMarkets) {
      const ticker = await fetchCoinoneTicker(m.market_symbol);
      if (ticker) {
        const key = `COINONE_${m.quote_symbol}`;
        if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
        priceMap[m.base_symbol][key] = extractPrice(ticker, "COINONE") || 0;
      }
    }

    // 해외 거래소 병렬 처리 (소수 심볼만)
    const foreignPromises: Promise<void>[] = [];

    for (const m of binanceMarkets) {
      foreignPromises.push(
        fetchBinanceTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `BINANCE_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "BINANCE") || 0;
          }
        })
      );
    }

    for (const m of binanceFuturesMarkets) {
      foreignPromises.push(
        fetchBinanceTicker(m.market_symbol, true).then((ticker) => {
          if (ticker) {
            const key = `BINANCE_FUTURES_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "BINANCE_FUTURES") || 0;
          }
        })
      );
    }

    for (const m of okxMarkets) {
      foreignPromises.push(
        fetchOkxTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `OKX_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "OKX") || 0;
          }
        })
      );
    }

    for (const m of bybitMarkets) {
      foreignPromises.push(
        fetchBybitTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `BYBIT_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "BYBIT") || 0;
          }
        })
      );
    }

    for (const m of bitgetMarkets) {
      foreignPromises.push(
        fetchBitgetTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `BITGET_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "BITGET") || 0;
          }
        })
      );
    }

    for (const m of gateMarkets) {
      foreignPromises.push(
        fetchGateTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `GATE_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "GATE") || 0;
          }
        })
      );
    }

    for (const m of htxMarkets) {
      foreignPromises.push(
        fetchHtxTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `HTX_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "HTX") || 0;
          }
        })
      );
    }

    for (const m of mexcMarkets) {
      foreignPromises.push(
        fetchMexcTicker(m.market_symbol).then((ticker) => {
          if (ticker) {
            const key = `MEXC_${m.quote_symbol}`;
            if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
            priceMap[m.base_symbol][key] = extractPrice(ticker, "MEXC") || 0;
          }
        })
      );
    }

    await Promise.all(foreignPromises);

    // 프리미엄 계산
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
