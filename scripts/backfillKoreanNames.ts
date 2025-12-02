/**
 * master_symbols 한글명 백필 스크립트
 * ko_name IS NULL 또는 ko_name = symbol인 행들을 국내 거래소 한글명으로 채움
 */

import { createClient } from "@supabase/supabase-js";
import { initializeMarkets, getCoinMetadataMap } from "./exchangeFetchers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

interface MasterSymbolRow {
  id: string;
  symbol: string;
  ko_name: string | null;
}

type KoreanNameMap = Record<string, string>;

async function buildKoreanNameMap(): Promise<KoreanNameMap> {
  console.log("[BackfillKoreanNames] Initializing markets...");
  
  try {
    // exchangeFetchers에서 제공하는 한글명 맵 구성 (업비트 API 기반)
    await initializeMarkets();
    const metadataMap = getCoinMetadataMap();

    const result: KoreanNameMap = {};

    // coinMetadata 맵에서 한글명 추출 (업비트 API에서 가져옴)
    const entries = Array.from(metadataMap.entries());
    for (const [symbol, metadata] of entries) {
      if (metadata.koreanName && metadata.koreanName !== symbol) {
        result[symbol] = metadata.koreanName;
      }
    }

    console.log(`[BackfillKoreanNames] Built Korean name map with ${Object.keys(result).length} symbols`);
    return result;
  } catch (error) {
    console.error("[BackfillKoreanNames] Error building Korean name map:", error);
    return {};
  }
}

async function backfillMasterSymbols(koreanNameMap: KoreanNameMap): Promise<void> {
  console.log("[BackfillKoreanNames] Fetching master_symbols from Supabase...");

  try {
    // 모든 master_symbols 조회
    const { data, error } = await supabase
      .from("master_symbols")
      .select("id, symbol, ko_name");

    if (error) {
      console.error("[BackfillKoreanNames] Fetch error:", error.message);
      process.exit(1);
    }

    const rows = (data ?? []) as MasterSymbolRow[];
    console.log(`[BackfillKoreanNames] Found ${rows.length} total rows in master_symbols`);

    // ko_name IS NULL 또는 ko_name = symbol인 행들만 필터링
    const updates: { id: string; ko_name: string }[] = [];

    for (const row of rows) {
      // 이미 ko_name이 있고 symbol과 다르면 (즉, 이미 한글명 세팅된 경우) 스킵
      if (row.ko_name && row.ko_name !== row.symbol) {
        continue;
      }

      const symbol = row.symbol.toUpperCase();
      const koreanName = koreanNameMap[symbol];

      // 맵에 있는 한글명만 업데이트
      if (koreanName) {
        updates.push({
          id: row.id,
          ko_name: koreanName,
        });
      }
    }

    console.log(`[BackfillKoreanNames] Prepared updates: ${updates.length}`);

    if (updates.length === 0) {
      console.log("[BackfillKoreanNames] No updates needed");
      return;
    }

    // 100개씩 chunk 처리
    const chunkSize = 100;
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      
      const { error: upErr } = await supabase
        .from("master_symbols")
        .upsert(chunk, { onConflict: "id" });

      if (upErr) {
        console.error("[BackfillKoreanNames] Upsert error:", upErr.message);
        process.exit(1);
      }

      totalUpdated += chunk.length;
      console.log(`[BackfillKoreanNames] Updated ${totalUpdated}/${updates.length}`);
    }

    console.log(`[BackfillKoreanNames] ✅ Backfill complete! Updated ${totalUpdated} rows`);
  } catch (error) {
    console.error("[BackfillKoreanNames] Unexpected error:", error);
    process.exit(1);
  }
}

async function main() {
  console.log("[BackfillKoreanNames] Starting Korean name backfill...\n");

  try {
    const koreanNameMap = await buildKoreanNameMap();
    await backfillMasterSymbols(koreanNameMap);
  } catch (error) {
    console.error("[BackfillKoreanNames] Fatal error:", error);
    process.exit(1);
  }
}

main().then(() => {
  console.log("[BackfillKoreanNames] Done!");
  process.exit(0);
}).catch((err) => {
  console.error("[BackfillKoreanNames] Unhandled error:", err);
  process.exit(1);
});
