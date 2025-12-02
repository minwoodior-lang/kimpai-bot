import fs from "fs";
import path from "path";

type ExchangeId = "UPBIT" | "BITHUMB" | "COINONE";

interface IconMap {
  [key: string]: string;
}

function loadExchangeMarkets(): Array<{ exchange: ExchangeId; base: string }> {
  const file = path.join("data", "exchange_markets.json");
  const text = fs.readFileSync(file, "utf-8");
  const json = JSON.parse(text) as any[];

  return json
    .filter((m) => ["UPBIT", "BITHUMB", "COINONE"].includes(m.exchange))
    .map((m) => ({
      exchange: m.exchange,
      base: m.base.toUpperCase(),
    }));
}

async function main() {
  const markets = loadExchangeMarkets();

  const pairs = new Set<string>();
  for (const m of markets) {
    pairs.add(`${m.exchange}:${m.base}`);
  }

  const iconMap: IconMap = {};

  for (const pair of Array.from(pairs).sort()) {
    const [exchange, symbol] = pair.split(":") as [ExchangeId, string];
    iconMap[pair] = `/icons/${exchange}/${symbol}.png`;
  }

  const out = path.join("data", "exchangeIcons.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(iconMap, null, 2), "utf-8");

  console.log(`✅ exchangeIcons.json 생성: ${Object.keys(iconMap).length} 항목`);
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
