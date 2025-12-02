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

async function fetchWithRetry(url: string, maxRetries = 2): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data } = await axios.get(url, { timeout: 8000 });
      return data;
    } catch (e) {
      console.log(`[Retry ${i + 1}/${maxRetries}] ${url.substring(0, 60)}...`);
      if (i === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchUpbitTickers(markets: string[]): Promise<Record<string, any>> {
  try {
    if (!markets.length) return {};
    console.log(`[Upbit] Fetching ${markets.length} markets: ${markets.slice(0, 3).join(", ")}...`);
    const data = await fetchWithRetry(
      `https://api.upbit.com/v1/ticker?markets=${markets.join(",")}`
    );
    const result: Record<string, any> = {};
    if (Array.isArray(data)) {
      for (const row of data) {
        result[row.market] = row;
        console.log(`  ✓ ${row.market}: ${row.trade_price}`);
      }
    }
    console.log(`[Upbit] Retrieved ${Object.keys(result).length} tickers`);
    return result;
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
    return {};
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

function extractPrice(data: any, exchange: string): number | null {
  if (!data) return null;

  switch (exchange) {
    case "UPBIT":
      const price = data.trade_price;
      return price ? Number(price) : null;
    case "OKX":
      return Number(data.last) || null;
    default:
      return null;
  }
}

async function main() {
  console.log("[priceWorker] 시작\n");

  try {
    const markets = loadExchangeMarkets().filter((m) => m.is_active ?? true);

    // 거래소별 마켓 분류
    const upbitMarkets = markets.filter((m) => m.exchange === "UPBIT");
    const okxMarkets = markets.filter((m) => m.exchange === "OKX");

    console.log(`📊 Markets loaded: ${upbitMarkets.length} Upbit, ${okxMarkets.length} OKX\n`);

    const priceMap: Record<string, Record<string, number>> = {};

    // ===== Step 1: Upbit 배치 처리 =====
    console.log("=== Step 1: Upbit Tickers ===");
    const upbitSymbols = upbitMarkets.map((m) => m.market_symbol);
    const upbitTickers = await fetchUpbitTickers(upbitSymbols);
    
    console.log(`\n[Processing] ${upbitMarkets.length} Upbit markets`);
    for (const m of upbitMarkets) {
      const ticker = upbitTickers[m.market_symbol];
      if (ticker) {
        const price = extractPrice(ticker, "UPBIT");
        if (price) {
          const key = `UPBIT_${m.quote_symbol}`;
          if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
          priceMap[m.base_symbol][key] = price;
          console.log(`  ✓ ${m.base_symbol} (${m.market_symbol}): ${price}`);
        }
      } else {
        console.log(`  ✗ ${m.base_symbol} (${m.market_symbol}): NO TICKER`);
      }
    }

    // ===== Step 2: OKX 처리 =====
    console.log(`\n=== Step 2: OKX Tickers ===`);
    for (const m of okxMarkets) {
      const ticker = await fetchOkxTicker(m.market_symbol);
      if (ticker) {
        const price = extractPrice(ticker, "OKX");
        if (price) {
          const key = `OKX_${m.quote_symbol}`;
          if (!priceMap[m.base_symbol]) priceMap[m.base_symbol] = {};
          priceMap[m.base_symbol][key] = price;
          console.log(`  ✓ ${m.base_symbol} (${m.market_symbol}): $${price}`);
        }
      }
    }

    // ===== Step 3: 프리미엄 계산 =====
    console.log(`\n=== Step 3: Premium Calculation ===`);
    const rows: PremiumRow[] = [];

    for (const symbol in priceMap) {
      const prices = priceMap[symbol];
      const upbitKrw = prices.UPBIT_KRW || null;
      const okxUsdt = prices.OKX_USDT || null;

      let globalPriceKrw = okxUsdt ? okxUsdt * FX_DEFAULT : null;
      let premium = null;

      if (upbitKrw && globalPriceKrw) {
        premium = ((upbitKrw - globalPriceKrw) / globalPriceKrw) * 100;
        console.log(
          `  ${symbol}: ₩${upbitKrw.toLocaleString()} vs $${okxUsdt?.toFixed(2)} → ${premium.toFixed(2)}%`
        );
      } else {
        console.log(
          `  ${symbol}: 업비트=${upbitKrw?.toLocaleString() || "N/A"}, OKX=$${okxUsdt?.toFixed(2) || "N/A"}`
        );
      }

      rows.push({
        symbol,
        koreanPrice: upbitKrw,
        globalPrice: okxUsdt,
        globalPriceKrw,
        premium,
        domesticExchange: "UPBIT",
        foreignExchange: "OKX",
      });
    }

    const outPath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

    console.log(`\n✅ [priceWorker] 완료: ${rows.length}개 코인 저장됨`);
  } catch (error) {
    console.error("[priceWorker] 치명적 오류:", error);
    process.exit(1);
  }
}

main();
