import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  exchange: string;
  market_symbol: string;
  base_symbol: string;
  quote_symbol: string;
  market_type: string;
  is_active: boolean;
}

const markets: ExchangeMarket[] = [];

// ========== Upbit ==========
async function syncUpbit() {
  try {
    console.log("[Upbit] Syncing...");
    const upbitMarkets = await axios.get("https://api.upbit.com/v1/market/all", {
      timeout: 10000,
    });

    const seenUpbit = new Set<string>();
    for (const m of upbitMarkets.data) {
      const market = m.market;
      if (!market) continue;

      const [quote, base] = market.split("-");
      if (!base || !quote) continue;

      const key = `${quote}|${base}`;
      if (!seenUpbit.has(key)) {
        seenUpbit.add(key);
        markets.push({
          exchange: "UPBIT",
          market_symbol: market,
          base_symbol: base,
          quote_symbol: quote,
          market_type: "spot",
          is_active: true,
        });
      }
    }
    console.log(`  ✓ Upbit: ${seenUpbit.size} markets`);
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
  }
}

// ========== Bithumb ==========
async function syncBithumb() {
  try {
    console.log("[Bithumb] Syncing KRW/BTC/USDT...");
    const quotes = ["KRW", "BTC", "USDT"];
    const seenBithumb = new Set<string>();

    for (const quote of quotes) {
      try {
        const endpoint = quote === "KRW" ? "ALL_KRW" : `ALL_${quote}`;
        const resp = await axios.get(
          `https://api.bithumb.com/public/ticker/${endpoint}`,
          { timeout: 8000 },
        );

        if (resp.data?.data) {
          for (const base in resp.data.data) {
            if (base === "date") continue;
            const marketSymbol = `${base}_${quote}`;
            const key = `${quote}|${base}`;

            if (!seenBithumb.has(key)) {
              seenBithumb.add(key);
              markets.push({
                exchange: "BITHUMB",
                market_symbol: marketSymbol,
                base_symbol: base.toUpperCase(),
                quote_symbol: quote,
                market_type: "spot",
                is_active: true,
              });
            }
          }
        }
      } catch (e) {
        console.log(`  ⚠ Bithumb ${quote}: ${(e as any).message}`);
      }
    }
    console.log(`  ✓ Bithumb: ${seenBithumb.size} markets`);
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }
}

// ========== Coinone ==========
async function syncCoinone() {
  try {
    console.log("[Coinone] Syncing...");
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });

    const seenCoinone = new Set<string>();
    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;
        const marketSymbol = `${base}-KRW`;
        const key = `KRW|${base}`;

        if (!seenCoinone.has(key)) {
          seenCoinone.add(key);
          markets.push({
            exchange: "COINONE",
            market_symbol: marketSymbol,
            base_symbol: base.toUpperCase(),
            quote_symbol: "KRW",
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ Coinone: ${seenCoinone.size} markets`);
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }
}

// ========== Binance Spot ==========
async function syncBinanceSpot() {
  try {
    console.log("[Binance Spot] Syncing...");
    const resp = await axios.get("https://api.binance.com/api/v3/ticker/price", {
      timeout: 10000,
    });

    const seenBinance = new Set<string>();
    for (const ticker of resp.data) {
      const symbol: string = ticker.symbol;
      if (!symbol.endsWith("USDT") && !symbol.endsWith("BTC")) continue;

      let base: string, quote: string;
      if (symbol.endsWith("USDT")) {
        base = symbol.slice(0, -4);
        quote = "USDT";
      } else if (symbol.endsWith("BTC")) {
        base = symbol.slice(0, -3);
        quote = "BTC";
      } else continue;

      const key = `${quote}|${base}`;
      if (!seenBinance.has(key) && base.length > 0) {
        seenBinance.add(key);
        markets.push({
          exchange: "BINANCE",
          market_symbol: symbol,
          base_symbol: base,
          quote_symbol: quote,
          market_type: "spot",
          is_active: true,
        });
      }
    }
    console.log(`  ✓ Binance Spot: ${seenBinance.size} markets`);
  } catch (e) {
    console.error(`[Binance Spot] Error: ${(e as any).message}`);
  }
}

// ========== Binance Futures ==========
async function syncBinanceFutures() {
  try {
    console.log("[Binance Futures] Syncing...");
    const resp = await axios.get("https://fapi.binance.com/fapi/v1/ticker/price", {
      timeout: 10000,
    });

    const seenFutures = new Set<string>();
    for (const ticker of resp.data) {
      const symbol: string = ticker.symbol;
      if (!symbol.endsWith("USDT")) continue;

      const base = symbol.slice(0, -4);
      const quote = "USDT";
      const key = `${quote}|${base}`;

      if (!seenFutures.has(key) && base.length > 0) {
        seenFutures.add(key);
        markets.push({
          exchange: "BINANCE_FUTURES",
          market_symbol: symbol,
          base_symbol: base,
          quote_symbol: quote,
          market_type: "futures",
          is_active: true,
        });
      }
    }
    console.log(`  ✓ Binance Futures: ${seenFutures.size} markets`);
  } catch (e) {
    console.error(`[Binance Futures] Error: ${(e as any).message}`);
  }
}

// ========== OKX ==========
async function syncOKX() {
  try {
    console.log("[OKX] Syncing...");
    const resp = await axios.get(
      "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
      { timeout: 10000 },
    );

    const seenOKX = new Set<string>();
    if (resp.data?.data) {
      for (const ticker of resp.data.data) {
        const instId: string = ticker.instId;
        if (!instId.endsWith("-USDT")) continue;

        const [base, quote] = instId.split("-");
        const key = `${quote}|${base}`;

        if (!seenOKX.has(key)) {
          seenOKX.add(key);
          markets.push({
            exchange: "OKX",
            market_symbol: instId,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ OKX: ${seenOKX.size} markets`);
  } catch (e) {
    console.error(`[OKX] Error: ${(e as any).message}`);
  }
}

// ========== Bybit ==========
async function syncBybit() {
  try {
    console.log("[Bybit] Syncing...");
    const resp = await axios.get(
      "https://api.bybit.com/v5/market/tickers?category=spot&limit=1000",
      { timeout: 10000 },
    );

    const seenBybit = new Set<string>();
    if (resp.data?.result?.list) {
      for (const ticker of resp.data.result.list) {
        const symbol: string = ticker.symbol;
        if (!symbol.endsWith("USDT")) continue;

        const base = symbol.slice(0, -4);
        const quote = "USDT";
        const key = `${quote}|${base}`;

        if (!seenBybit.has(key)) {
          seenBybit.add(key);
          markets.push({
            exchange: "BYBIT",
            market_symbol: symbol,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ Bybit: ${seenBybit.size} markets`);
  } catch (e) {
    console.error(`[Bybit] Error: ${(e as any).message}`);
  }
}

// ========== Bitget ==========
async function syncBitget() {
  try {
    console.log("[Bitget] Syncing...");
    const resp = await axios.get("https://api.bitget.com/api/spot/v1/market/tickers", {
      timeout: 10000,
    });

    const seenBitget = new Set<string>();
    if (resp.data?.data) {
      for (const ticker of resp.data.data) {
        const symbol: string = ticker.symbol;
        if (!symbol.endsWith("USDT")) continue;

        const base = symbol.slice(0, -4);
        const quote = "USDT";
        const key = `${quote}|${base}`;

        if (!seenBitget.has(key)) {
          seenBitget.add(key);
          markets.push({
            exchange: "BITGET",
            market_symbol: symbol,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ Bitget: ${seenBitget.size} markets`);
  } catch (e) {
    console.error(`[Bitget] Error: ${(e as any).message}`);
  }
}

// ========== Gate.io ==========
async function syncGate() {
  try {
    console.log("[Gate.io] Syncing...");
    const resp = await axios.get("https://api.gateio.ws/api/v4/spot/tickers", {
      timeout: 10000,
    });

    const seenGate = new Set<string>();
    if (Array.isArray(resp.data)) {
      for (const ticker of resp.data) {
        const currency_pair: string = ticker.currency_pair;
        if (!currency_pair.endsWith("USDT")) continue;

        const [base, quote] = currency_pair.split("_");
        const key = `${quote}|${base}`;

        if (!seenGate.has(key)) {
          seenGate.add(key);
          markets.push({
            exchange: "GATE",
            market_symbol: currency_pair,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ Gate.io: ${seenGate.size} markets`);
  } catch (e) {
    console.error(`[Gate.io] Error: ${(e as any).message}`);
  }
}

// ========== HTX ==========
async function syncHTX() {
  try {
    console.log("[HTX] Syncing...");
    const resp = await axios.get("https://api.huobi.pro/market/tickers", {
      timeout: 10000,
    });

    const seenHTX = new Set<string>();
    if (resp.data?.data) {
      for (const ticker of resp.data.data) {
        const symbol: string = ticker.symbol;
        if (!symbol.endsWith("usdt")) continue;

        const base = symbol.slice(0, -4).toUpperCase();
        const quote = "USDT";
        const key = `${quote}|${base}`;

        if (!seenHTX.has(key)) {
          seenHTX.add(key);
          markets.push({
            exchange: "HTX",
            market_symbol: symbol,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ HTX: ${seenHTX.size} markets`);
  } catch (e) {
    console.error(`[HTX] Error: ${(e as any).message}`);
  }
}

// ========== MEXC ==========
async function syncMEXC() {
  try {
    console.log("[MEXC] Syncing...");
    const resp = await axios.get("https://api.mexc.com/api/v3/ticker/price", {
      timeout: 10000,
    });

    const seenMEXC = new Set<string>();
    if (Array.isArray(resp.data)) {
      for (const ticker of resp.data) {
        const symbol: string = ticker.symbol;
        if (!symbol.endsWith("USDT")) continue;

        const base = symbol.slice(0, -4);
        const quote = "USDT";
        const key = `${quote}|${base}`;

        if (!seenMEXC.has(key)) {
          seenMEXC.add(key);
          markets.push({
            exchange: "MEXC",
            market_symbol: symbol,
            base_symbol: base,
            quote_symbol: quote,
            market_type: "spot",
            is_active: true,
          });
        }
      }
    }
    console.log(`  ✓ MEXC: ${seenMEXC.size} markets`);
  } catch (e) {
    console.error(`[MEXC] Error: ${(e as any).message}`);
  }
}

async function main() {
  console.log("[syncMarkets] 시작\n");

  await Promise.all([
    syncUpbit(),
    syncBithumb(),
    syncCoinone(),
    syncBinanceSpot(),
    syncBinanceFutures(),
    syncOKX(),
    syncBybit(),
    syncBitget(),
    syncGate(),
    syncHTX(),
    syncMEXC(),
  ]);

  const outPath = path.join(process.cwd(), "data", "exchange_markets.json");
  fs.writeFileSync(outPath, JSON.stringify(markets, null, 2));

  console.log(
    `\n✅ [syncMarkets] 완료: ${markets.length}개 마켓 저장됨 (${new Set(markets.map((m) => m.exchange)).size}개 거래소)`,
  );
}

main().catch((e) => {
  console.error("[syncMarkets] 오류:", e);
  process.exit(1);
});
