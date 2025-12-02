import fs from "fs";
import path from "path";

interface UpbitApiMarket {
  market: string;
  korean_name: string;
  english_name: string;
}

interface RawMarket {
  exchange: "UPBIT" | "BITHUMB" | "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

async function fetchUpbitMarkets() {
  const url = "https://api.upbit.com/v1/market/all?isDetails=true";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Upbit API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as UpbitApiMarket[];

  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠ Upbit markets response is empty or invalid");
  }

  // KRW/BTC/USDT 마켓만 필터
  const markets = data.filter((m) =>
    m.market.startsWith("KRW-") ||
    m.market.startsWith("BTC-") ||
    m.market.startsWith("USDT-")
  );

  const normalized: RawMarket[] = markets.map((m) => {
    const [quote, base] = m.market.split("-");

    return {
      exchange: "UPBIT",
      market_code: m.market,
      base_symbol: base.toUpperCase(),
      quote_symbol: quote.toUpperCase(),
      name_ko: m.korean_name?.trim() || undefined,
      name_en: m.english_name?.trim() || undefined,
    };
  });

  const outPath = path.join("data", "raw", "upbit", "markets.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), "utf-8");

  console.log(`✅ Upbit markets saved: ${normalized.length} rows`);
}

fetchUpbitMarkets().catch((err) => {
  console.error("❌ fetchUpbitMarkets failed:", err);
  process.exit(1);
});
