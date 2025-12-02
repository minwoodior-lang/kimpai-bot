import fs from "fs";
import path from "path";

interface Market {
  exchange: string;
  base: string;
  name_ko?: string;
  name_en?: string;
}

interface MasterSymbol {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  icon_path?: string;
}

const PRIORITY_ORDER = ["UPBIT", "BITHUMB", "COINONE"];

export async function buildMasterSymbols() {
  const exchangeMarketsPath = path.join(process.cwd(), "data", "exchange_markets.json");
  const exchangeIconsPath = path.join(process.cwd(), "data", "exchangeIcons.json");

  const markets = JSON.parse(fs.readFileSync(exchangeMarketsPath, "utf-8")) as Market[];
  const iconMap = JSON.parse(fs.readFileSync(exchangeIconsPath, "utf-8")) as Record<string, string>;

  const symbolMap = new Map<string, MasterSymbol>();

  for (const market of markets) {
    const symbol = market.base.toUpperCase();
    if (!symbolMap.has(symbol)) {
      symbolMap.set(symbol, { symbol });
    }

    const entry = symbolMap.get(symbol)!;

    if (market.name_ko && !entry.name_ko) {
      entry.name_ko = market.name_ko;
    }
    if (market.name_en && !entry.name_en) {
      entry.name_en = market.name_en;
    }

    if (!entry.icon_path) {
      for (const exchange of PRIORITY_ORDER) {
        const iconKey = `${exchange}:${symbol}`;
        if (iconMap[iconKey]) {
          entry.icon_path = iconMap[iconKey];
          break;
        }
      }
    }
  }

  const masterSymbols = Array.from(symbolMap.values()).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  const outputPath = path.join(process.cwd(), "data", "master_symbols.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(masterSymbols, null, 2), "utf-8");

  console.log(`✅ master_symbols.json 생성 완료: ${masterSymbols.length}개 심볼`);
  return masterSymbols;
}

buildMasterSymbols().catch((e) => {
  console.error("❌ buildMasterSymbols failed:", e);
  process.exit(1);
});
