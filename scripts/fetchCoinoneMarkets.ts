import fs from "fs";
import path from "path";

interface RawMarket {
  exchange: "UPBIT" | "BITHUMB" | "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

async function fetchCoinoneMarkets() {
  const res = await fetch("https://api.coinone.co.kr/public/v2/markets/KRW", {
    timeout: 8000,
  });

  if (!res.ok) {
    throw new Error(`Coinone API error: ${res.status}`);
  }

  const json = (await res.json()) as any;

  if (!json?.markets || !Array.isArray(json.markets)) {
    throw new Error("Invalid Coinone API response");
  }

  const markets: RawMarket[] = json.markets.map((m: any) => ({
    exchange: "COINONE",
    market_code: m.market,
    base_symbol: (m.target_currency || "").toUpperCase(),
    quote_symbol: m.base_currency || "KRW",
  }));

  const marketPath = path.join("data", "raw", "coinone", "markets.json");
  fs.mkdirSync(path.dirname(marketPath), { recursive: true });
  fs.writeFileSync(marketPath, JSON.stringify(markets, null, 2), "utf-8");

  // names.json은 비어있는 상태 (나중에 HTML 크롤링으로 채울 수 있음)
  const namesPath = path.join("data", "raw", "coinone", "names.json");
  fs.writeFileSync(namesPath, JSON.stringify({}, null, 2), "utf-8");

  console.log(`✅ Coinone markets saved: ${markets.length} rows`);
}

fetchCoinoneMarkets().catch((err) => {
  console.error("❌ fetchCoinoneMarkets failed:", err);
  process.exit(1);
});
