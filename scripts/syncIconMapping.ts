import fs from "fs";
import path from "path";

interface ExchangeMarket {
  exchange: string;
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url?: string;
}

export function main() {
  console.log("[Icon Mapping] 시작\n");

  try {
    const exchangeMarketsPath = path.join(
      process.cwd(),
      "data",
      "exchange_markets.json"
    );
    const markets: ExchangeMarket[] = JSON.parse(
      fs.readFileSync(exchangeMarketsPath, "utf8")
    );

    // 심볼별 기본 icon_url 설정 (한 번만)
    const seen = new Set<string>();
    for (const market of markets) {
      if (!seen.has(market.base_symbol)) {
        market.icon_url = `/coins/${market.base_symbol}.png`;
        seen.add(market.base_symbol);
      } else {
        market.icon_url = `/coins/${market.base_symbol}.png`;
      }
    }

    fs.writeFileSync(
      exchangeMarketsPath,
      JSON.stringify(markets, null, 2)
    );

    console.log(`✅ [Icon Mapping] 완료: ${markets.length}개 마켓\n`);
  } catch (error) {
    console.error("[Icon Mapping] 오류:", error);
    process.exit(1);
  }
}

main();
