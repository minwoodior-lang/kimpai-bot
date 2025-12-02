import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  exchange: string;
  market: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string | null;
}

interface PremiumRow {
  symbol: string;
  exchange: string;
  market: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  volume24hKrw: number | null;
  volume24hUsdt: number | null;
  change24h: number | null;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string | null;
}

const FX_DEFAULT = 1350;

function loadExchangeMarkets(): ExchangeMarket[] {
  const filePath = path.join(process.cwd(), "data", "exchange_markets.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function fetchAllPrices() {
  const priceMap: Record<string, Record<string, number>> = {};

  try {
    const resp = await axios.get(
      "https://api.upbit.com/v1/market/all?isDetails=true",
      { timeout: 10000 }
    );

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
    const resp = await axios.get(
      "https://api.bithumb.com/public/ticker/ALL_KRW",
      { timeout: 8000 }
    );
    if (resp.data?.data) {
      for (const base in resp.data.data) {
        if (base === "date") continue;
        const sym = base.toUpperCase();
        if (!priceMap[sym]) priceMap[sym] = {};
        priceMap[sym]["BITHUMB_KRW"] = Number(
          resp.data.data[base].closing_price
        );
      }
    }
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }

  try {
    const resp = await axios.get(
      "https://api.coinone.co.kr/ticker?currency=all",
      { timeout: 8000 }
    );
    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result")
          continue;
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
    const resp = await axios.get(
      "https://api.gateio.ws/api/v4/spot/tickers",
      { timeout: 10000 }
    );
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

    // ✅ exchange_markets의 각 마켓별로 프리미엘 계산 (심볼 축약 절대 금지!)
    for (const market of markets) {
      const symbol = market.base_symbol;
      const prices = priceMap[symbol];

      if (!prices) continue;

      // 국내 시세
      const krwPrices = Object.entries(prices)
        .filter(([k]) => k.includes("KRW"))
        .map(([, v]) => v);
      const koreanPrice =
        krwPrices.length > 0
          ? krwPrices.reduce((a, b) => a + b) / krwPrices.length
          : null;

      // 해외 시세
      const usdtPrices = Object.entries(prices)
        .filter(([k]) => k.includes("USDT"))
        .map(([, v]) => v);
      const globalPrice =
        usdtPrices.length > 0
          ? usdtPrices.reduce((a, b) => a + b) / usdtPrices.length
          : null;

      const globalPriceKrw = globalPrice ? globalPrice * FX_DEFAULT : null;
      let premium: number | null = null;

      if (koreanPrice && globalPriceKrw) {
        premium = ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
      }

      // 국내 시세가 있을 때만 저장 (exchange_markets의 마켓별로!)
      if (koreanPrice && globalPrice) {
        rows.push({
          exchange: market.exchange,
          market_symbol: market.market_symbol,
          symbol,
          koreanPrice,
          globalPrice,
          globalPriceKrw,
          premium,
          name_ko: market.name_ko,
          name_en: market.name_en,
          icon_url: market.icon_url,
        });
      }
    }

    // ✅ 중복 제거 (같은 exchange:symbol 조합 1번만 남기기)
    const seen = new Set<string>();
    const deduped: PremiumRow[] = [];

    for (const row of rows) {
      const key = `${row.exchange}:${row.symbol}`;
      if (seen.has(key)) {
        console.warn(`⚠️ [priceWorker] 중복 제거: ${key}`);
        continue;
      }
      seen.add(key);
      deduped.push(row);
    }

    deduped.sort((a, b) => (b.premium || 0) - (a.premium || 0));

    // ✅ 매번 새로 생성 (append하지 않기!)
    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2));

    console.log(`✅ [priceWorker] 완료: ${deduped.length}개 마켓 (중복 ${rows.length - deduped.length}개 제거)\n`);
    console.log(`[priceWorker] 거래소별 마켓:`);

    const byEx: Record<string, number> = {};
    for (const row of deduped) {
      byEx[row.exchange] = (byEx[row.exchange] || 0) + 1;
    }
    for (const [ex, count] of Object.entries(byEx)) {
      console.log(`  ${ex}: ${count}`);
    }
  } catch (error) {
    console.error("[priceWorker] 오류:", error);
    process.exit(1);
  }
}

main();
