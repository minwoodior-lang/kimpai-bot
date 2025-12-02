import axios from "axios";

export interface UpbitName {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

export async function syncUpbitNames(): Promise<Record<string, UpbitName>> {
  const result: Record<string, UpbitName> = {};

  try {
    console.log("[Upbit Names] Fetching...");
    const resp = await axios.get("https://api.upbit.com/v1/market/all?isDetails=true", {
      timeout: 10000,
    });

    for (const market of resp.data) {
      const fullName: string = market.market || "";
      if (!fullName.startsWith("KRW-")) continue;

      const [, base] = fullName.split("-");
      if (!base) continue;

      result[base] = {
        base_symbol: base,
        name_ko: market.korean_name || null,
        name_en: market.english_name || base,
      };
    }

    console.log(`  ✓ Upbit: ${Object.keys(result).length} names collected`);
  } catch (e) {
    console.error(`[Upbit Names] Error: ${(e as any).message}`);
  }

  return result;
}
