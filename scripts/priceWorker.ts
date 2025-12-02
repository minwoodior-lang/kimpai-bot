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
  return JSON.parse(raw) as ExchangeMarket[];
}

async function fetchAllTickerData(markets: ExchangeMarket[]) {
  const priceMap: Record<string, Record<string, number>> = {};

  // ===== Upbit (KRW only) =====
  try {
    const upbitKrwMarkets = markets
      .filter((m) => m.exchange === "UPBIT" && m.quote_symbol === "KRW")
      .map((m) => m.market_symbol);

    if (upbitKrwMarkets.length > 0) {
      const resp = await axios.get(
        `https://api.upbit.com/v1/ticker?markets=${upbitKrwMarkets.join(",")}`,
        { timeout: 10000 },
      );

      if (Array.isArray(resp.data)) {
        for (const ticker of resp.data) {
          const [, base] = ticker.market.split("-");
          const price = Number(ticker.trade_price);
          if (!priceMap[base]) priceMap[base] = {};
          priceMap[base]["UPBIT_KRW"] = price;
        }
      }
    }
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
  }

  // ===== Bithumb (KRW only) =====
  try {
    const resp = await axios.get(
      "https://api.bithumb.com/public/ticker/ALL_KRW",
      { timeout: 8000 },
    );

    if (resp.data?.data) {
      for (const base in resp.data.data) {
        if (base === "date") continue;
        const price = Number(resp.data.data[base].closing_price);
        if (!priceMap[base.toUpperCase()]) priceMap[base.toUpperCase()] = {};
        priceMap[base.toUpperCase()]["BITHUMB_KRW"] = price;
      }
    }
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }

  // ===== Coinone (KRW only) =====
  try {
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });

    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;
        const price = Number(resp.data[base].last);
        if (!priceMap[base.toUpperCase()]) priceMap[base.toUpperCase()] = {};
        priceMap[base.toUpperCase()]["COINONE_KRW"] = price;
      }
    }
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }

  // ===== OKX (USDT only) =====
  try {
    const resp = await axios.get(
      "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
      { timeout: 10000 },
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

  // ===== Gate.io (USDT only) =====
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
    console.log(`📊 ${markets.length}개 마켓 로드됨\n`);

    const priceMap = await fetchAllTickerData(markets);

    const rows: PremiumRow[] = [];

    for (const symbol in priceMap) {
      const prices = priceMap[symbol];

      const krwPrices = Object.entries(prices)
        .filter(([k]) => k.includes("KRW"))
        .map(([, v]) => v);
      const koreanPrice =
        krwPrices.length > 0
          ? krwPrices.reduce((a, b) => a + b, 0) / krwPrices.length
          : null;

      const usdtPrices = Object.entries(prices)
        .filter(([k]) => k.includes("USDT"))
        .map(([, v]) => v);
      const globalPrice =
        usdtPrices.length > 0
          ? usdtPrices.reduce((a, b) => a + b, 0) / usdtPrices.length
          : null;

      const globalPriceKrw = globalPrice ? globalPrice * FX_DEFAULT : null;
      let premium: number | null = null;

      if (koreanPrice && globalPriceKrw) {
        premium = ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
      }

      // 한국 시세와 글로벌 시세 모두 있는 경우만 저장
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

    // 프리미엄순으로 정렬 (높은 순)
    rows.sort((a, b) => (b.premium || 0) - (a.premium || 0));

    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

    console.log(
      `✅ [priceWorker] 완료: ${rows.length}개 코인 저장됨 (양쪽 시세 완전 매칭)\n`,
    );
  } catch (error) {
    console.error("[priceWorker] 오류:", error);
    process.exit(1);
  }
}

main();
