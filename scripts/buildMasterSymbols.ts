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
  cmc_slug?: string | null;
}

const PRIORITY_ORDER = ["UPBIT", "BITHUMB", "COINONE"];

export async function buildMasterSymbols() {
  const exchangeMarketsPath = path.join(process.cwd(), "data", "exchange_markets.json");
  const symbolIconsPath = path.join(process.cwd(), "data", "symbolIcons.json");
  const masterSymbolsPath = path.join(process.cwd(), "data", "master_symbols.json");

  const markets = JSON.parse(fs.readFileSync(exchangeMarketsPath, "utf-8")) as Market[];
  const symbolIcons = JSON.parse(fs.readFileSync(symbolIconsPath, "utf-8")) as Record<string, string>;

  // 기존 master_symbols.json 로드 (cmc_slug 값 유지)
  let existingMap = new Map<string, any>();
  try {
    const existing = JSON.parse(fs.readFileSync(masterSymbolsPath, "utf-8")) as MasterSymbol[];
    existing.forEach(item => {
      existingMap.set(item.symbol, item);
    });
  } catch {
    // 파일이 없으면 무시
  }

  const symbolMap = new Map<string, MasterSymbol>();

  for (const market of markets) {
    const symbol = market.base.toUpperCase();
    if (!symbolMap.has(symbol)) {
      // 기존 cmc_slug 값 유지
      const existing = existingMap.get(symbol);
      symbolMap.set(symbol, { 
        symbol,
        cmc_slug: existing?.cmc_slug || null  // 기존 값 유지, 없으면 null로 초기화
      });
    }

    const entry = symbolMap.get(symbol)!;

    if (market.name_ko && !entry.name_ko) {
      entry.name_ko = market.name_ko;
    }
    if (market.name_en && !entry.name_en) {
      entry.name_en = market.name_en;
    }

    // symbolIcons.json 기준으로 아이콘 설정 (심볼 단위 통합)
    if (!entry.icon_path && symbolIcons[symbol]) {
      entry.icon_path = symbolIcons[symbol];
    }
  }

  const masterSymbols = Array.from(symbolMap.values()).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  fs.mkdirSync(path.dirname(masterSymbolsPath), { recursive: true });
  fs.writeFileSync(masterSymbolsPath, JSON.stringify(masterSymbols, null, 2), "utf-8");

  console.log(`✅ master_symbols.json 생성 완료: ${masterSymbols.length}개 심볼`);
  return masterSymbols;
}

buildMasterSymbols().catch((e) => {
  console.error("❌ buildMasterSymbols failed:", e);
  process.exit(1);
});
