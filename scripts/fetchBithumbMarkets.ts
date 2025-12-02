import fs from "fs";
import path from "path";

interface BithumbApiMarket {
  market: string;
  korean_name?: string;
  english_name?: string;
}

interface RawMarket {
  exchange: "BITHUMB";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

const BITHUMB_FALLBACK: Record<string, { name_ko?: string; name_en?: string }> = {
  USDT: { name_ko: "테더", name_en: "Tether" },
  USDC: { name_ko: "유에스디", name_en: "USDC" },
  BTC: { name_ko: "비트코인", name_en: "Bitcoin" },
  ETH: { name_ko: "이더리움", name_en: "Ethereum" },
  XRP: { name_ko: "리플", name_en: "XRP" },
  LTC: { name_ko: "라이트코인", name_en: "Litecoin" },
  BCH: { name_ko: "비트코인캐시", name_en: "Bitcoin Cash" },
  EOS: { name_ko: "이오스", name_en: "EOS" },
  TRX: { name_ko: "트론", name_en: "TRON" },
  ADA: { name_ko: "카르다노", name_en: "Cardano" },
};

async function fetchBithumbMarkets() {
  const url = "https://api.bithumb.com/v1/market/all";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bithumb API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as BithumbApiMarket[] | any;
  const apiMarkets: BithumbApiMarket[] = Array.isArray(data)
    ? data
    : data?.data ?? [];

  if (!Array.isArray(apiMarkets) || apiMarkets.length === 0) {
    throw new Error("Bithumb API returned no markets");
  }

  const result: RawMarket[] = apiMarkets
    .filter((m) => {
      const [quote] = m.market.split("-");
      return quote === "KRW" || quote === "BTC" || quote === "USDT";
    })
    .map((m) => {
      const parts = m.market.split("-");
      const base = parts.slice(0, -1).join("-").toUpperCase();
      const quote = parts[parts.length - 1].toUpperCase();

      const fromApiKo = m.korean_name?.trim();
      const fromApiEn = m.english_name?.trim();

      const fromFallback = BITHUMB_FALLBACK[base] ?? {};

      const name_ko = fromApiKo || fromFallback.name_ko || undefined;
      const name_en = fromApiEn || fromFallback.name_en || undefined;

      const market: RawMarket = {
        exchange: "BITHUMB",
        market_code: m.market,
        base_symbol: base,
        quote_symbol: quote,
        ...(name_ko ? { name_ko } : {}),
        ...(name_en ? { name_en } : {}),
      };

      return market;
    });

  const outPath = path.join("data", "raw", "bithumb", "markets.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  const total = result.length;
  const withName = result.filter((m) => m.name_ko || m.name_en).length;

  console.log(
    `✅ Bithumb markets fetched: total=${total}, withName=${withName}, withoutName=${total - withName}`
  );
}

fetchBithumbMarkets().catch((err) => {
  console.error("❌ fetchBithumbMarkets failed:", err);
  process.exit(1);
});
