import fs from "fs";
import path from "path";

type ExchangeId = "UPBIT" | "BITHUMB" | "COINONE";

interface ExchangeMarket {
  exchange: ExchangeId;
  base: string;
}

interface IconMap {
  [key: string]: string; // "UPBIT:BTC" → "/icons/UPBIT/BTC.png"
}

const EXCHANGE_ICON_SOURCES: Record<ExchangeId, string[]> = {
  UPBIT: [
    (symbol) =>
      `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://static.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
  ],
  BITHUMB: [
    (symbol) =>
      `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://static.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
  ],
  COINONE: [
    (symbol) =>
      `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`,
    (symbol) =>
      `https://static.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
  ],
};

async function downloadIcon(
  exchange: ExchangeId,
  symbol: string
): Promise<string | null> {
  const sources = EXCHANGE_ICON_SOURCES[exchange];
  const upper = symbol.toUpperCase();

  for (const urlBuilder of sources) {
    const url = urlBuilder(upper);

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const buf = await res.arrayBuffer();
      const dir = path.join("public", "icons", exchange);
      fs.mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, `${upper}.png`);
      fs.writeFileSync(filePath, Buffer.from(buf));

      const publicPath = `/icons/${exchange}/${upper}.png`;
      console.log(`✅ [${exchange}] ${upper} → ${url.split("/").slice(-1)[0]}`);
      return publicPath;
    } catch (e) {
      // Try next source
    }
  }

  console.warn(`⚠️ [${exchange}] ${upper} - all sources failed`);
  return null;
}

function loadExchangeMarkets(): ExchangeMarket[] {
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

  console.log(`📊 수집할 아이콘: ${pairs.size}개\n`);

  const iconMap: IconMap = {};

  for (const pair of Array.from(pairs).sort()) {
    const [exchange, symbol] = pair.split(":") as [ExchangeId, string];

    const publicPath = await downloadIcon(exchange, symbol);
    if (publicPath) {
      iconMap[pair] = publicPath;
    }
  }

  const out = path.join("data", "exchangeIcons.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(iconMap, null, 2), "utf-8");

  const total = Object.keys(iconMap).length;
  console.log(
    `\n✅ exchangeIcons.json 생성 완료: ${total}/${pairs.size} 아이콘 저장됨`
  );
}

main().catch((e) => {
  console.error("❌ fetchDomesticIcons failed:", e);
  process.exit(1);
});
