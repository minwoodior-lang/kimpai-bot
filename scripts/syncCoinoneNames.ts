import axios from "axios";

export interface CoinoneName {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

export async function syncCoinoneNames(): Promise<Record<string, CoinoneName>> {
  const result: Record<string, CoinoneName> = {};

  try {
    console.log("[Coinone Names] Fetching...");

    // Coinone API에서 모든 코인 시세 조회
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });

    if (resp.data?.result === 1) {
      for (const key in resp.data) {
        if (!key || key.startsWith("timestamp") || key === "result")
          continue;

        const symbol = key.toUpperCase();
        if (!result[symbol]) {
          result[symbol] = {
            base_symbol: symbol,
            name_ko: null,
            name_en: null,
          };
        }
      }
    }

    console.log(`  ✓ Coinone: ${Object.keys(result).length} symbols`);
  } catch (e) {
    console.error(`[Coinone Names] Error: ${(e as any).message}`);
  }

  return result;
}
