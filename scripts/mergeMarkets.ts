import fs from "fs";
import path from "path";

type ExchangeId = "UPBIT" | "BITHUMB" | "COINONE";

interface RawMarket {
  exchange: ExchangeId;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

interface ExchangeMarket {
  id: string;
  exchange: ExchangeId;
  market: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  isDomestic: boolean;
}

const DOMESTIC_EXCHANGES: ExchangeId[] = ["UPBIT", "BITHUMB", "COINONE"];

function loadRawMarkets(exchange: ExchangeId): RawMarket[] {
  const filePath = path.join(
    "data",
    "raw",
    exchange.toLowerCase(),
    "markets.json"
  );

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ raw markets file not found: ${filePath}`);
    return [];
  }

  const text = fs.readFileSync(filePath, "utf-8");
  if (!text.trim()) return [];

  try {
    const json = JSON.parse(text);
    if (!Array.isArray(json)) {
      console.warn(`⚠ raw markets is not array for ${exchange}`);
      return [];
    }
    return json as RawMarket[];
  } catch (e) {
    console.error(`❌ failed to parse ${filePath}:`, e);
    return [];
  }
}

function main() {
  const upbit = loadRawMarkets("UPBIT");
  const bithumb = loadRawMarkets("BITHUMB");
  const coinone = loadRawMarkets("COINONE");

  const allRaw: RawMarket[] = [...upbit, ...bithumb, ...coinone];

  const map = new Map<string, ExchangeMarket>();

  for (const m of allRaw) {
    if (!m.exchange || !m.market_code || !m.base_symbol || !m.quote_symbol) {
      continue;
    }

    const exchange = m.exchange;
    const market = m.market_code;
    const base = m.base_symbol.toUpperCase();
    const quote = m.quote_symbol.toUpperCase();

    const id = `${exchange}:${market}`;

    if (map.has(id)) continue;

    const isDomestic = DOMESTIC_EXCHANGES.includes(exchange);

    const em: ExchangeMarket = {
      id,
      exchange,
      market,
      base,
      quote,
      ...(m.name_ko ? { name_ko: m.name_ko } : {}),
      ...(m.name_en ? { name_en: m.name_en } : {}),
      isDomestic,
    };

    map.set(id, em);
  }

  const result = Array.from(map.values()).sort((a, b) => {
    if (a.exchange !== b.exchange) {
      return a.exchange.localeCompare(b.exchange);
    }
    if (a.base !== b.base) {
      return a.base.localeCompare(b.base);
    }
    if (a.quote !== b.quote) {
      return a.quote.localeCompare(b.quote);
    }
    return a.market.localeCompare(b.market);
  });

  const outPath = path.join("data", "exchange_markets.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(
    `✅ exchange_markets.json saved: ${result.length} markets (UPBIT: ${upbit.length}, BITHUMB: ${bithumb.length}, COINONE: ${coinone.length})`
  );
}

try {
  main();
} catch (err) {
  console.error("❌ mergeMarkets failed:", err);
  process.exit(1);
}
