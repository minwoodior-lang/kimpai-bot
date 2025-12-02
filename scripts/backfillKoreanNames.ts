// scripts/backfillKoreanNames.ts

import { createClient } from "@supabase/supabase-js";

type MasterSymbolRow = {
  id: string;
  symbol: string;
  ko_name: string | null;
};

type NameMap = Record<string, string>;

type UpdateRow = {
  id: string;
  symbol: string;
  ko_name: string;
};

// 마켓 문자열에서 심볼만 추출 (KRW-BTC, BTC_KRW 등)
function extractSymbol(market: string | undefined | null): string | null {
  if (!market) return null;

  let base: string | undefined;
  let quote: string | undefined;

  if (market.includes("-")) {
    const [a, b] = market.split("-");
    base = a;
    quote = b;
  } else if (market.includes("_")) {
    const [a, b] = market.split("_");
    base = a;
    quote = b;
  } else {
    return null;
  }

  if (base === "KRW") return quote || null;
  if (quote === "KRW") return base || null;

  // KRW 마켓이 아니면 일단 두 번째 파트 사용
  return quote || base || null;
}

/**
 * 업비트: https://api.upbit.com/v1/market/all?isDetails=true
 * -> market: "KRW-BTC", korean_name 포함
 */
async function fetchUpbitNames(): Promise<NameMap> {
  const map: NameMap = {};

  try {
    const res = await fetch(
      "https://api.upbit.com/v1/market/all?isDetails=true"
    );
    if (!res.ok) {
      console.error("[BackfillKoreanNames] Upbit HTTP error:", res.status);
      return map;
    }

    const data: any[] = await res.json();

    for (const m of data) {
      if (!m.market || !m.market.startsWith("KRW-")) continue;

      const symbol = extractSymbol(m.market);
      const name = m.korean_name as string | undefined;

      if (symbol && name && !map[symbol]) {
        map[symbol] = name;
      }
    }

    console.log(
      `[BackfillKoreanNames] Upbit map size: ${Object.keys(map).length}`
    );
  } catch (err) {
    console.error("[BackfillKoreanNames] Upbit fetch failed:", err);
  }

  return map;
}

/**
 * 빗썸: https://api.bithumb.com/v1/market/all
 * -> market, korean_name, english_name
 */
async function fetchBithumbNames(): Promise<NameMap> {
  const map: NameMap = {};

  try {
    const res = await fetch("https://api.bithumb.com/v1/market/all");
    if (!res.ok) {
      console.error("[BackfillKoreanNames] Bithumb HTTP error:", res.status);
      return map;
    }

    const body: any = await res.json();
    const items: any[] = body.data ?? body ?? [];

    for (const m of items) {
      const market = m.market as string | undefined;
      const name = m.korean_name as string | undefined;
      if (!market || !name) continue;

      const symbol = extractSymbol(m.market);
      if (symbol && !map[symbol]) {
        map[symbol] = name;
      }
    }

    console.log(
      `[BackfillKoreanNames] Bithumb map size: ${Object.keys(map).length}`
    );
  } catch (err) {
    console.error("[BackfillKoreanNames] Bithumb fetch failed:", err);
  }

  return map;
}

/**
 * 코인원: 전체 가상자산 정보 조회
 * https://api.coinone.co.kr/public/v2/currencies
 *
 * ⚠️ 여기는 "영문명(name)"만 있어서,
 *    한글명이 없을 때 마지막 fallback 정도로만 사용.
 */
async function fetchCoinoneNames(): Promise<NameMap> {
  const map: NameMap = {};

  try {
    const res = await fetch("https://api.coinone.co.kr/public/v2/currencies");
    if (!res.ok) {
      console.error("[BackfillKoreanNames] Coinone HTTP error:", res.status);
      return map;
    }

    const body: any = await res.json();
    const items: any[] = body.currencies ?? [];

    for (const c of items) {
      const symbol = c.symbol as string | undefined;
      const engName = c.name as string | undefined;
      if (!symbol || !engName) continue;

      // 여기는 아직 영문명이라, 진짜 아무 정보도 없을 때만 후보로 쓸 예정
      if (!map[symbol]) {
        map[symbol] = engName;
      }
    }

    console.log(
      `[BackfillKoreanNames] Coinone map size: ${Object.keys(map).length}`
    );
  } catch (err) {
    console.error("[BackfillKoreanNames] Coinone fetch failed:", err);
  }

  return map;
}

async function buildKoreanNameMap(): Promise<NameMap> {
  console.log(
    "[BackfillKoreanNames] Loading exchange names for Korean backfill..."
  );

  // 업비트 + 빗썸 + (코인원 영문 fallback) 병렬로 가져오기
  const [upbit, bithumb, coinone] = await Promise.all([
    fetchUpbitNames(),
    fetchBithumbNames(),
    fetchCoinoneNames(),
  ]);

  const merged: NameMap = {};

  // 우선순위: Upbit > Bithumb > Coinone(영문 fallback)
  for (const [s, n] of Object.entries(coinone)) merged[s] = n;
  for (const [s, n] of Object.entries(bithumb)) merged[s] = n;
  for (const [s, n] of Object.entries(upbit)) merged[s] = n;

  console.log(
    `[BackfillKoreanNames] Combined map size: ${Object.keys(merged).length}`
  );

  return merged;
}

async function main() {
  console.log("[BackfillKoreanNames] Starting Korean name backfill...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "❌ Supabase env missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const nameMap = await buildKoreanNameMap();

  console.log(
    "[BackfillKoreanNames] Fetching master_symbols from Supabase..."
  );
  const { data, error } = await supabase
    .from("master_symbols")
    .select("id, symbol, ko_name");

  if (error) {
    console.error("❌ Failed to fetch master_symbols:", error);
    process.exit(1);
  }

  const rows = (data ?? []) as MasterSymbolRow[];
  console.log(
    `[BackfillKoreanNames] Found ${rows.length} total rows in master_symbols`
  );

  const updates: UpdateRow[] = [];

  for (const row of rows) {
    if (!row.id || !row.symbol) continue;

    const current = row.ko_name;

    // 이미 ko_name 이 있고, 심볼과 다르면 (= 제대로 한글/영문 구조) 그대로 둔다.
    if (current && current !== row.symbol) continue;

    const candidate = nameMap[row.symbol];
    if (!candidate) continue;

    // 코인원 영문명 fallback 은 row.symbol 과 완전 동일하면 스킵 (영문/영문 유지)
    if (candidate.toUpperCase() === row.symbol.toUpperCase()) continue;

    updates.push({
      id: row.id,
      symbol: row.symbol,
      ko_name: candidate,
    });
  }

  console.log(
    `[BackfillKoreanNames] Prepared updates: ${updates.length}`
  );

  if (updates.length === 0) {
    console.log("No rows to update. ✅ Nothing to do.");
    return;
  }

  const chunkSize = 100;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);

    const { error: upErr } = await supabase
      .from("master_symbols")
      .upsert(chunk, { onConflict: "id" });

    if (upErr) {
      console.error("❌ Upsert error:", upErr);
      process.exit(1);
    }

    console.log(
      `[BackfillKoreanNames] Updated ${i + chunk.length}/${updates.length}`
    );
  }

  console.log("✅ Backfill complete!");
}

main().catch((err) => {
  console.error("❌ Fatal error in backfill:", err);
  process.exit(1);
});
