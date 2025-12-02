import axios from "axios";

export interface BithumbName {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

export async function syncBithumbNames(): Promise<Record<string, BithumbName>> {
  const result: Record<string, BithumbName> = {};

  try {
    console.log("[Bithumb Names] Fetching...");

    // Bithumb API에서 사용 가능한 모든 마켓 수집
    const quotes = ["KRW", "BTC", "USDT"];

    for (const quote of quotes) {
      try {
        const endpoint = quote === "KRW" ? "ALL_KRW" : `ALL_${quote}`;
        const resp = await axios.get(
          `https://api.bithumb.com/public/ticker/${endpoint}`,
          { timeout: 8000 }
        );

        if (resp.data?.data) {
          for (const symbol in resp.data.data) {
            if (symbol === "date") continue;
            const sym = symbol.toUpperCase();
            if (!result[sym]) {
              result[sym] = {
                base_symbol: sym,
                name_ko: null,
                name_en: null,
              };
            }
          }
        }
      } catch (e) {
        console.log(
          `  ⚠ Bithumb ${quote}: ${(e as any).message}`
        );
      }
    }

    console.log(`  ✓ Bithumb: ${Object.keys(result).length} symbols`);
  } catch (e) {
    console.error(`[Bithumb Names] Error: ${(e as any).message}`);
  }

  return result;
}
