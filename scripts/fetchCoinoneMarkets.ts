import fs from "fs";
import path from "path";
const cheerio = require("cheerio");

interface RawMarket {
  exchange: "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

const COINONE_ASSET_URL =
  "https://support.coinone.co.kr/support/solutions/articles/31000163237";

async function fetchCoinoneSupportNameMap(): Promise<
  Record<string, { ko: string | null; en: string | null }>
> {
  try {
    console.log("🔄 Fetching Coinone support page...");

    const res = await fetch(COINONE_ASSET_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const map: Record<string, { ko: string | null; en: string | null }> = {};

    // 테이블 행 순회 (심볼 / 국문명 / 영문명 / 네트워크 / 메모)
    $("table tbody tr").each((_, row: any) => {
      const tds = $(row).find("td");

      if (tds.length < 3) return;

      const symbol = $(tds[0]).text().trim().toUpperCase();
      const koName = $(tds[1]).text().trim() || null;
      const enName = $(tds[2]).text().trim() || null;

      if (!symbol) return;

      map[symbol] = { ko: koName, en: enName };
    });

    console.log(`✅ Coinone support: ${Object.keys(map).length}개 심볼 크롤링됨`);
    return map;
  } catch (err) {
    console.warn(
      "⚠ Coinone support page crawl failed:",
      err instanceof Error ? err.message : String(err)
    );
    return {};
  }
}

async function fetchCoinoneMarkets() {
  const [marketsRes, nameMap] = await Promise.all([
    fetch("https://api.coinone.co.kr/public/v2/markets/KRW"),
    fetchCoinoneSupportNameMap(),
  ]);

  if (!marketsRes.ok) {
    throw new Error(
      `Coinone API error: ${marketsRes.status} ${marketsRes.statusText}`
    );
  }

  const json = (await marketsRes.json()) as any;
  const markets = json.markets ?? [];

  if (!Array.isArray(markets)) {
    throw new Error("Coinone API returned invalid markets format");
  }

  const result: RawMarket[] = markets.map((m: any) => {
    const base = (m.target_currency ?? "").toUpperCase();
    const quote = (m.base_currency ?? "").toUpperCase();
    const marketCode = m.market;

    const names = nameMap[base] ?? { ko: null, en: null };

    const name_ko = names.ko?.trim() || undefined;
    const name_en = names.en?.trim() || undefined;

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
