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

async function fetchUpbitMarkets(): Promise<Record<string, any>> {
  try {
    const upbitMarkets = [
      "KRW-BTC",
      "KRW-ETH",
      "KRW-XRP",
      "KRW-ADA",
      "KRW-DOGE",
      "KRW-SOL",
    ];
    const url = `https://api.upbit.com/v1/ticker?markets=${upbitMarkets.join(",")}`;
    console.log(`[Upbit] Requesting: ${url}`);

    const { data } = await axios.get(url, { timeout: 8000 });
    const result: Record<string, any> = {};

    if (Array.isArray(data)) {
      for (const row of data) {
        result[row.market] = row;
        const [quote, base] = row.market.split("-");
        console.log(`  ✓ ${row.market} → symbol: ${base}, price: ${row.trade_price}`);
      }
    }

    console.log(`[Upbit] Success: ${Object.keys(result).length} tickers received\n`);
    return result;
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message || e}\n`);
    return {};
  }
}

async function fetchOkxMarkets(): Promise<Record<string, any>> {
  try {
    const okxMarkets = ["BTC-USDT", "ETH-USDT", "XRP-USDT"];
    const result: Record<string, any> = {};

    for (const market of okxMarkets) {
      const url = `https://www.okx.com/api/v5/market/ticker?instId=${market}`;
      const { data } = await axios.get(url, { timeout: 8000 });
      const ticker = data?.data?.[0];
      if (ticker) {
        result[market] = ticker;
        const [base] = market.split("-");
        console.log(`  ✓ ${market} → symbol: ${base}, price: $${ticker.last}`);
      }
    }

    console.log(`[OKX] Success: ${Object.keys(result).length} tickers received\n`);
    return result;
  } catch (e) {
    console.error(`[OKX] Error: ${(e as any).message}\n`);
    return {};
  }
}

function extractUpbitPrice(ticker: any): number | null {
  if (!ticker) return null;
  const price = ticker.trade_price;
  return price ? Number(price) : null;
}

function extractOkxPrice(ticker: any): number | null {
  if (!ticker) return null;
  const price = ticker.last;
  return price ? Number(price) : null;
}

async function main() {
  console.log("[priceWorker] 시작\n");

  try {
    // ===== Fetch Data =====
    console.log("=== Fetching Data ===\n");

    console.log("[Step 1] Upbit KRW Markets");
    const upbitTickers = await fetchUpbitMarkets();

    console.log("[Step 2] OKX USDT Markets");
    const okxTickers = await fetchOkxMarkets();

    // ===== Build Price Map =====
    console.log("=== Building Price Map ===\n");
    const priceMap: Record<string, Record<string, number>> = {};

    // Process Upbit
    for (const market in upbitTickers) {
      const ticker = upbitTickers[market];
      const [quote, base] = market.split("-");
      const price = extractUpbitPrice(ticker);

      if (base && price) {
        if (!priceMap[base]) priceMap[base] = {};
        priceMap[base][`UPBIT_${quote}`] = price;
        console.log(`  ${base}: ₩${price.toLocaleString()} (${market})`);
      }
    }

    // Process OKX
    for (const market in okxTickers) {
      const ticker = okxTickers[market];
      const [base] = market.split("-");
      const price = extractOkxPrice(ticker);

      if (base && price) {
        if (!priceMap[base]) priceMap[base] = {};
        priceMap[base][`OKX_USDT`] = price;
        console.log(`  ${base}: $${price.toFixed(2)} (${market})`);
      }
    }

    // ===== Calculate Premium =====
    console.log("\n=== Premium Calculation ===\n");
    const rows: PremiumRow[] = [];

    for (const symbol in priceMap) {
      const prices = priceMap[symbol];
      const koreanPrice = prices.UPBIT_KRW || null;
      const globalPrice = prices.OKX_USDT || null;
      const globalPriceKrw = globalPrice ? globalPrice * FX_DEFAULT : null;

      let premium: number | null = null;
      if (koreanPrice && globalPriceKrw) {
        premium = ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
      }

      rows.push({
        symbol,
        koreanPrice,
        globalPrice,
        globalPriceKrw,
        premium,
        domesticExchange: "UPBIT",
        foreignExchange: "OKX",
      });

      const status =
        koreanPrice && globalPrice
          ? `✓ 김프: ${premium?.toFixed(2)}%`
          : `⚠ 불완전 (한: ${koreanPrice ? "O" : "X"}, 글: ${globalPrice ? "O" : "X"})`;
      console.log(`  ${symbol}: ${status}`);
    }

    // ===== Save =====
    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

    console.log(`\n✅ [priceWorker] 완료: ${rows.length}개 코인\n`);
  } catch (error) {
    console.error("[priceWorker] 치명적 오류:", error);
    process.exit(1);
  }
}

main();
