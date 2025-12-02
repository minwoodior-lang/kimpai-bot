import fs from "fs";
import path from "path";

interface RawMarket {
  exchange: "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

type CoinoneNameMap = {
  [symbol: string]: { name_ko?: string; name_en?: string };
};

async function fetchCoinoneMarkets() {
  const namesPath = path.join("data", "raw", "coinone", "names.json");
  const coinoneNameMap: CoinoneNameMap = fs.existsSync(namesPath)
    ? JSON.parse(fs.readFileSync(namesPath, "utf-8"))
    : {};

  const res = await fetch("https://api.coinone.co.kr/public/v2/markets/KRW");
  if (!res.ok) {
    throw new Error(
      `Coinone API error: ${res.status} ${res.statusText}`
    );
  }

  const json = (await res.json()) as any;
  const markets = json.markets ?? [];

  if (!Array.isArray(markets)) {
    throw new Error("Coinone API returned invalid markets format");
  }

  const result: RawMarket[] = markets.map((m: any) => {
    const base = (m.target_currency ?? "").toUpperCase();
    const quote = (m.base_currency ?? "").toUpperCase();
    const marketCode = m.market;

    const names = coinoneNameMap[base] ?? {};

    const name_ko = names.name_ko?.trim() || undefined;
    const name_en = names.name_en?.trim() || undefined;

    const row: RawMarket = {
      exchange: "COINONE",
      market_code: marketCode,
      base_symbol: base,
      quote_symbol: quote,
      ...(name_ko ? { name_ko } : {}),
      ...(name_en ? { name_en } : {}),
    };

    return row;
  });

  const outPath = path.join("data", "raw", "coinone", "markets.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  const total = result.length;
  const withName = result.filter((m) => m.name_ko || m.name_en).length;

  console.log(
    `✅ Coinone markets fetched: total=${total}, withName=${withName}, withoutName=${total - withName}`
  );
}

fetchCoinoneMarkets().catch((err) => {
  console.error("❌ fetchCoinoneMarkets failed:", err);
  process.exit(1);
});
