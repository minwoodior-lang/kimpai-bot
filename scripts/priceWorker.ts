import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  base_symbol: string;
  quote_symbol: string;
  exchange: string;
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
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function fetchAllPrices() {
  const priceMap: Record<string, Record<string, number>> = {};

  // ===== Upbit KRW =====
  try {
    const resp = await axios.get("https://api.upbit.com/v1/market/all?isDetails=true", {
      timeout: 10000,
    });

    for (const m of resp.data) {
      const market: string = m.market;
      if (!market.startsWith("KRW-")) continue;

      const [, base] = market.split("-");
      if (!priceMap[base]) priceMap[base] = {};
      priceMap[base]["UPBIT_KRW"] = Number(m.trade_price);
    }
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
  }

  // 실제로는 따로 ticker 호출 필요
  try {
    const upbitSymbols = Object.keys(priceMap).map((s) => `KRW-${s}`);
    if (upbitSymbols.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < upbitSymbols.length; i += batchSize) {
        const batch = upbitSymbols.slice(i, i + batchSize);
        const resp = await axios.get(
          `https://api.upbit.com/v1/ticker?markets=${batch.join(",")}`,
          { timeout: 10000 }
        );

        if (Array.isArray(resp.data)) {
          for (const ticker of resp.data) {
            const [, base] = ticker.market.split("-");
            if (!priceMap[base]) priceMap[base] = {};
            priceMap[base]["UPBIT_KRW"] = Number(ticker.trade_price);
          }
        }
      }
    }
  } catch (e) {
    console.error(`[Upbit ticker] Error: ${(e as any).message}`);
  }

  // ===== Bithumb KRW =====
  try {
    const resp = await axios.get("https://api.bithumb.com/public/ticker/ALL_KRW", {
      timeout: 8000,
    });
    if (resp.data?.data) {
      for (const base in resp.data.data) {
        if (base === "date") continue;
        const baseNorm = base.toUpperCase();
        if (!priceMap[baseNorm]) priceMap[baseNorm] = {};
        priceMap[baseNorm]["BITHUMB_KRW"] = Number(resp.data.data[base].closing_price);
      }
    }
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }

  // ===== Coinone KRW =====
  try {
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });
    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;
        const baseNorm = base.toUpperCase();
        if (!priceMap[baseNorm]) priceMap[baseNorm] = {};
        priceMap[baseNorm]["COINONE_KRW"] = Number(resp.data[base].last);
      }
    }
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }

  // ===== OKX USDT =====
  try {
    const resp = await axios.get(
      "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
      { timeout: 10000 }
    );
    if (resp.data?.data) {
      for (const ticker of resp.data.data) {
        const instId: string = ticker.instId;
        if (!instId.endsWith("-USDT")) continue;
        const [base] = instId.split("-");
        if (!priceMap[base]) priceMap[base] = {};
        priceMap[base]["OKX_USDT"] = Number(ticker.last);
      }
    }
  } catch (e) {
    console.error(`[OKX] Error: ${(e as any).message}`);
  }

  // ===== Gate.io USDT =====
  try {
    const resp = await axios.get("https://api.gateio.ws/api/v4/spot/tickers", {
      timeout: 10000,
    });
    if (Array.isArray(resp.data)) {
      for (const ticker of resp.data) {
        const pair: string = ticker.currency_pair;
        if (!pair.endsWith("USDT")) continue;
        const [base] = pair.split("_");
        if (!priceMap[base]) priceMap[base] = {};
        priceMap[base]["GATE_USDT"] = Number(ticker.last);
      }
    }
  } catch (e) {
    console.error(`[Gate.io] Error: ${(e as any).message}`);
  }

  return priceMap;
}

async function main() {
  console.log("[priceWorker] 시작\n");

  try {
    const markets = loadExchangeMarkets();
    const priceMap = await fetchAllPrices();

    const rows: PremiumRow[] = [];
    const seen = new Set<string>();

    for (const symbol in priceMap) {
      if (!symbol || symbol.length === 0 || seen.has(symbol)) continue;
      seen.add(symbol);

      const prices = priceMap[symbol];

      const krwPrices = Object.entries(prices)
        .filter(([k]) => k.includes("KRW"))
        .map(([, v]) => v);
      const koreanPrice =
        krwPrices.length > 0 ? krwPrices.reduce((a, b) => a + b) / krwPrices.length : null;

      const usdtPrices = Object.entries(prices)
        .filter(([k]) => k.includes("USDT"))
        .map(([, v]) => v);
      const globalPrice =
        usdtPrices.length > 0 ? usdtPrices.reduce((a, b) => a + b) / usdtPrices.length : null;

      const globalPriceKrw = globalPrice ? globalPrice * FX_DEFAULT : null;
      let premium: number | null = null;

      if (koreanPrice && globalPriceKrw) {
        premium = ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
      }

      if (koreanPrice && globalPrice) {
        rows.push({
          symbol,
          koreanPrice,
          globalPrice,
          globalPriceKrw,
          premium,
          domesticExchange: "DOMESTIC",
          foreignExchange: "FOREIGN",
        });
      }
    }

    rows.sort((a, b) => (b.premium || 0) - (a.premium || 0));

    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

    console.log(`✅ [priceWorker] 완료: ${rows.length}개 코인\n`);
  } catch (error) {
    console.error("[priceWorker] 오류:", error);
    process.exit(1);
  }
}

main();
