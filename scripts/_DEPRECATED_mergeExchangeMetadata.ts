import fs from "fs";
import path from "path";
import { syncUpbitNames } from "./syncUpbitNames";
import { syncBithumbNames } from "./syncBithumbNames";
import { syncCoinoneNames } from "./syncCoinoneNames";

interface MergedMetadata {
  symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

interface ExchangeMarket {
  exchange: string;
  market: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

export async function main() {
  console.log("[Merge] 시작\n");

  try {
    // 1. 세 거래소에서 이름 수집
    console.log("[Merge] 수집 중...\n");
    const [upbitNames, bithumbNames, coinoneNames] = await Promise.all([
      syncUpbitNames(),
      syncBithumbNames(),
      syncCoinoneNames(),
    ]);

    // 2. 모든 심볼 수집
    const allSymbols = new Set<string>([
      ...Object.keys(upbitNames),
      ...Object.keys(bithumbNames),
      ...Object.keys(coinoneNames),
    ]);

    console.log(`\n[Merge] 총 심볼: ${allSymbols.size}`);

    // 3. 병합 (우선순위: Upbit > Coinone > Bithumb)
    const merged: Record<string, MergedMetadata> = {};

    for (const symbol of Array.from(allSymbols)) {
      merged[symbol] = {
        symbol,
        name_ko:
          upbitNames[symbol]?.name_ko ||
          coinoneNames[symbol]?.name_ko ||
          bithumbNames[symbol]?.name_ko ||
          null,
        name_en:
          upbitNames[symbol]?.name_en ||
          coinoneNames[symbol]?.name_en ||
          bithumbNames[symbol]?.name_en ||
          symbol,
      };
    }

    // 4. exchange_markets 업데이트
    const exchangeMarketsPath = path.join(
      process.cwd(),
      "data",
      "exchange_markets.json"
    );
    const oldMarkets: any[] = JSON.parse(
      fs.readFileSync(exchangeMarketsPath, "utf8")
    );

    const updatedMarkets: ExchangeMarket[] = oldMarkets.map((m) => ({
      ...m,
      name_ko: merged[m.base_symbol]?.name_ko || null,
      name_en: merged[m.base_symbol]?.name_en || m.base_symbol,
    }));

    fs.writeFileSync(
      exchangeMarketsPath,
      JSON.stringify(updatedMarkets, null, 2)
    );

    console.log(`\n[Merge] exchange_markets 업데이트: ${updatedMarkets.length}개`);

    // 5. 거래소별 통계
    const byExchange: Record<string, number> = {};
    for (const m of updatedMarkets) {
      byExchange[m.exchange] = (byExchange[m.exchange] || 0) + 1;
    }

    console.log("\n[Merge] 거래소별 마켓:");
    for (const [ex, count] of Object.entries(byExchange)) {
      console.log(`  ${ex}: ${count}`);
    }

    console.log(`\n✅ [Merge] 완료\n`);
  } catch (error) {
    console.error("[Merge] 오류:", error);
    process.exit(1);
  }
}

main();
