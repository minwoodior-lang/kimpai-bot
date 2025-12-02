import fs from "fs";
import path from "path";
import axios from "axios";

interface Market {
  exchange: string;
  market_symbol: string;
  base_symbol: string;
  quote_symbol: string;
  market_type: string;
  is_active: boolean;
}

async function fetchUpbitMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get(
      "https://api.upbit.com/v1/market/all?isDetails=false"
    );
    const markets: Market[] = [];
    for (const market of data) {
      const [quote, base] = market.market.split("-");
      if (quote === "KRW" || quote === "BTC" || quote === "USDT") {
        markets.push({
          exchange: "UPBIT",
          market_symbol: market.market,
          base_symbol: base,
          quote_symbol: quote,
          market_type: "spot",
          is_active: !market.closed,
        });
      }
    }
    console.log(`✅ Upbit: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Upbit fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchBithumbMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get(
      "https://api.bithumb.com/public/ticker/ALL_KRW"
    );
    const markets: Market[] = [];
    if (data?.data) {
      for (const symbol in data.data) {
        if (symbol !== "date") {
          markets.push({
            exchange: "BITHUMB",
            market_symbol: `${symbol}_KRW`,
            base_symbol: symbol,
            quote_symbol: "KRW",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ Bithumb: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Bithumb fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchCoinoneMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get(
      "https://api.coinone.co.kr/public/v2/tickers/utc0?currency=ALL"
    );
    const markets: Market[] = [];
    if (data?.tickers) {
      for (const ticker of data.tickers) {
        if (ticker.target === "KRW") {
          markets.push({
            exchange: "COINONE",
            market_symbol: `${ticker.symbol}-KRW`,
            base_symbol: ticker.symbol,
            quote_symbol: "KRW",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ Coinone: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Coinone fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchBinanceMarkets(): Promise<Market[]> {
  try {
    const { data: spotData } = await axios.get(
      "https://api.binance.com/api/v3/exchangeInfo"
    );
    const markets: Market[] = [];

    // Spot USDT markets
    if (spotData?.symbols) {
      for (const sym of spotData.symbols) {
        if (
          sym.quoteAsset === "USDT" &&
          sym.status === "TRADING"
        ) {
          markets.push({
            exchange: "BINANCE",
            market_symbol: sym.symbol,
            base_symbol: sym.baseAsset,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }

    // Futures
    const { data: futureData } = await axios.get(
      "https://fapi.binance.com/fapi/v1/exchangeInfo"
    );
    if (futureData?.symbols) {
      for (const sym of futureData.symbols) {
        if (
          sym.quoteAsset === "USDT" &&
          sym.status === "TRADING"
        ) {
          markets.push({
            exchange: "BINANCE_FUTURES",
            market_symbol: sym.symbol,
            base_symbol: sym.baseAsset,
            quote_symbol: "USDT",
            market_type: "futures",
            is_active: true,
          });
        }
      }
    }

    console.log(`✅ Binance: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Binance fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchOkxMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
    const markets: Market[] = [];
    if (data?.data) {
      for (const inst of data.data) {
        const [base, quote] = inst.instId.split("-");
        if (quote === "USDT") {
          markets.push({
            exchange: "OKX",
            market_symbol: inst.instId,
            base_symbol: base,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ OKX: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ OKX fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchBybitMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get(
      "https://api.bybit.com/v5/market/instruments-info?category=spot&limit=1000"
    );
    const markets: Market[] = [];
    if (data?.result?.list) {
      for (const inst of data.result.list) {
        if (inst.quoteCoin === "USDT" && inst.status === "Trading") {
          markets.push({
            exchange: "BYBIT",
            market_symbol: inst.symbol,
            base_symbol: inst.baseCoin,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ Bybit: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Bybit fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchBitgetMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get(
      "https://api.bitget.com/spot/v1/public/products"
    );
    const markets: Market[] = [];
    if (data?.data) {
      for (const prod of data.data) {
        if (prod.quoteLanguage === "USDT") {
          markets.push({
            exchange: "BITGET",
            market_symbol: prod.symbol,
            base_symbol: prod.baseCoin,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ Bitget: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Bitget fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchGateMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get("https://api.gateio.ws/api/v4/spot/currency_pairs");
    const markets: Market[] = [];
    if (Array.isArray(data)) {
      for (const pair of data) {
        if (pair.quote === "USDT") {
          markets.push({
            exchange: "GATE",
            market_symbol: pair.id,
            base_symbol: pair.base,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ Gate.io: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ Gate.io fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchHtxMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get("https://api.huobi.pro/v1/common/symbols");
    const markets: Market[] = [];
    if (data?.data) {
      for (const sym of data.data) {
        if (sym.quote_currency === "usdt") {
          markets.push({
            exchange: "HTX",
            market_symbol: `${sym.base_currency}${sym.quote_currency}`,
            base_symbol: sym.base_currency.toUpperCase(),
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ HTX: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ HTX fetch failed:", (e as any).message);
    return [];
  }
}

async function fetchMexcMarkets(): Promise<Market[]> {
  try {
    const { data } = await axios.get("https://api.mexc.com/api/v3/exchangeInfo");
    const markets: Market[] = [];
    if (data?.symbols) {
      for (const sym of data.symbols) {
        if (sym.quoteAsset === "USDT" && sym.status === "TRADING") {
          markets.push({
            exchange: "MEXC",
            market_symbol: sym.symbol,
            base_symbol: sym.baseAsset,
            quote_symbol: "USDT",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`✅ MEXC: ${markets.length} markets`);
    return markets;
  } catch (e) {
    console.error("❌ MEXC fetch failed:", (e as any).message);
    return [];
  }
}

async function main() {
  console.log("🚀 Fetching markets from all exchanges...\n");

  const [upbit, bithumb, coinone, binance, okx, bybit, bitget, gate, htx, mexc] =
    await Promise.all([
      fetchUpbitMarkets(),
      fetchBithumbMarkets(),
      fetchCoinoneMarkets(),
      fetchBinanceMarkets(),
      fetchOkxMarkets(),
      fetchBybitMarkets(),
      fetchBitgetMarkets(),
      fetchGateMarkets(),
      fetchHtxMarkets(),
      fetchMexcMarkets(),
    ]);

  const allMarkets = [
    ...upbit,
    ...bithumb,
    ...coinone,
    ...binance,
    ...okx,
    ...bybit,
    ...bitget,
    ...gate,
    ...htx,
    ...mexc,
  ];

  console.log(`\n📊 Total markets: ${allMarkets.length}`);
  console.log(`🔢 Unique symbols: ${new Set(allMarkets.map((m) => m.base_symbol)).size}`);

  const outPath = path.join(process.cwd(), "data", "exchange_markets.json");
  fs.writeFileSync(outPath, JSON.stringify(allMarkets, null, 2));

  console.log(`\n✅ Saved to ${outPath}`);
}

main().catch(console.error);
