import fs from "fs";
import path from "path";
import axios from "axios";

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

async function fetchAllPrices() {
  const priceMap: Record<string, Record<string, number>> = {};

  try {
    const resp = await axios.get("https://api.upbit.com/v1/market/all?isDetails=true", {
      timeout: 10000,
    });

    for (const m of resp.data) {
      const market: string = m.market;
      if (!market || !market.startsWith("KRW-")) continue;

      const [, base] = market.split("-");
      if (!priceMap[base]) priceMap[base] = {};
      priceMap[base]["UPBIT_KRW"] = Number(m.trade_price || 0);
    }
  } catch (e) {
    console.error(`[Upbit detail] Error: ${(e as any).message}`);
  }

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

  try {
    const resp = await axios.get("https://api.bithumb.com/public/ticker/ALL_KRW", {
      timeout: 8000,
    });
    if (resp.data?.data) {
      for (const base in resp.data.data) {
        if (base === "date") continue;
        const sym = base.toUpperCase();
        if (!priceMap[sym]) priceMap[sym] = {};
        priceMap[sym]["BITHUMB_KRW"] = Number(resp.data.data[base].closing_price);
      }
    }
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }

  try {
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });
    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;
        const sym = base.toUpperCase();
        if (!priceMap[sym]) priceMap[sym] = {};
        priceMap[sym]["COINONE_KRW"] = Number(resp.data[base].last || 0);
      }
    }
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }

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
