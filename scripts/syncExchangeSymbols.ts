/**
 * 거래소별 원본 심볼(KRW-BTC, BTC, etc.)을
 * exchange_symbol_mappings 테이블과 동기화하는 스크립트
 *
 * 사용: npm run sync:exchange-symbols
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌ Supabase env missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

interface ExchangeSymbolMapping {
  base_symbol: string;
  exchange_name: string;
  exchange_symbol: string;
  exchange_market: string;
}

/**
 * 업비트: https://api.upbit.com/v1/market/all?isDetails=true
 * 형식: market = "KRW-BTC", "KRW-ETH" 등
 */
async function fetchUpbitSymbols(): Promise<ExchangeSymbolMapping[]> {
  const mappings: ExchangeSymbolMapping[] = [];

  try {
    const response = await fetch(
      "https://api.upbit.com/v1/market/all?isDetails=true"
    );
    if (!response.ok) {
      console.error("[SyncExchangeSymbols] Upbit HTTP error:", response.status);
      return mappings;
    }

    const data: any[] = await response.json();

    for (const market of data) {
      if (!market.market) continue;

      const [quote, base] = market.market.split("-");
      if (!base || !quote) continue;

      mappings.push({
        base_symbol: base,
        exchange_name: "upbit",
        exchange_symbol: market.market, // "KRW-BTC"
        exchange_market: quote, // "KRW", "USDT", "BTC"
      });
    }

    console.log(
      `[SyncExchangeSymbols] Upbit symbols: ${mappings.length} mappings`
    );
  } catch (err) {
    console.error("[SyncExchangeSymbols] Upbit fetch failed:", err);
  }

  return mappings;
}

/**
 * 빗썸: https://api.bithumb.com/public/ticker/ALL_KRW
 * 형식: symbol key는 "BTC", "ETH" 등
 */
async function fetchBithumbSymbols(): Promise<ExchangeSymbolMapping[]> {
  const mappings: ExchangeSymbolMapping[] = [];

  try {
    const [krwRes, btcRes] = await Promise.all([
      fetch("https://api.bithumb.com/public/ticker/ALL_KRW"),
      fetch("https://api.bithumb.com/public/ticker/ALL_BTC"),
    ]);

    const krwData = await krwRes.json();
    const btcData = await btcRes.json();

    // KRW market
    if (krwData.status === "0000" && krwData.data) {
      for (const symbol of Object.keys(krwData.data)) {
        if (symbol === "date") continue;
        mappings.push({
          base_symbol: symbol,
          exchange_name: "bithumb",
          exchange_symbol: symbol, // "BTC"
          exchange_market: "KRW",
        });
      }
    }

    // BTC market
    if (btcData.status === "0000" && btcData.data) {
      for (const symbol of Object.keys(btcData.data)) {
        if (symbol === "date" || symbol === "BTC") continue;
        mappings.push({
          base_symbol: symbol,
          exchange_name: "bithumb",
          exchange_symbol: symbol, // "ETH"
          exchange_market: "BTC",
        });
      }
    }

    console.log(
      `[SyncExchangeSymbols] Bithumb symbols: ${mappings.length} mappings`
    );
  } catch (err) {
    console.error("[SyncExchangeSymbols] Bithumb fetch failed:", err);
  }

  return mappings;
}

/**
 * 코인원: https://api.coinone.co.kr/public/v2/ticker_new/krw
 * 형식: target_currency = "btc", "eth" 등 (소문자)
 */
async function fetchCoinoneSymbols(): Promise<ExchangeSymbolMapping[]> {
  const mappings: ExchangeSymbolMapping[] = [];

  try {
    const response = await fetch(
      "https://api.coinone.co.kr/public/v2/ticker_new/krw"
    );
    if (!response.ok) {
      console.error(
        "[SyncExchangeSymbols] Coinone HTTP error:",
        response.status
      );
      return mappings;
    }

    const data: any = await response.json();

    if (data.result === "success" && data.tickers) {
      for (const ticker of data.tickers) {
        const symbol = ticker.target_currency?.toUpperCase();
        if (!symbol) continue;

        mappings.push({
          base_symbol: symbol,
          exchange_name: "coinone",
          exchange_symbol: symbol, // "BTC"
          exchange_market: "KRW",
        });
      }
    }

    console.log(
      `[SyncExchangeSymbols] Coinone symbols: ${mappings.length} mappings`
    );
  } catch (err) {
    console.error("[SyncExchangeSymbols] Coinone fetch failed:", err);
  }

  return mappings;
}

async function main() {
  console.log(
    "[SyncExchangeSymbols] Starting exchange symbol synchronization...\n"
  );

  try {
    // 모든 거래소에서 원본 심볼 가져오기
    const [upbit, bithumb, coinone] = await Promise.all([
      fetchUpbitSymbols(),
      fetchBithumbSymbols(),
      fetchCoinoneSymbols(),
    ]);

    const allMappings = [...upbit, ...bithumb, ...coinone];

    if (allMappings.length === 0) {
      console.log("[SyncExchangeSymbols] No mappings to sync.");
      return;
    }

    console.log(`\n[SyncExchangeSymbols] Total mappings to sync: ${allMappings.length}`);

    // 100개씩 chunk 처리
    const chunkSize = 100;
    for (let i = 0; i < allMappings.length; i += chunkSize) {
      const chunk = allMappings.slice(i, i + chunkSize);

      const { error } = await supabase
        .from("exchange_symbol_mappings")
        .upsert(chunk, {
          onConflict: "base_symbol,exchange_name,exchange_market",
        });

      if (error) {
        console.error(
          `[SyncExchangeSymbols] Upsert error at chunk ${i / chunkSize + 1}:`,
          error
        );
        process.exit(1);
      }

      console.log(
        `[SyncExchangeSymbols] Synced ${Math.min(i + chunkSize, allMappings.length)}/${allMappings.length}`
      );
    }

    console.log("\n✅ Exchange symbol sync complete!");
  } catch (err) {
    console.error("[SyncExchangeSymbols] Fatal error:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[SyncExchangeSymbols] Unhandled error:", err);
  process.exit(1);
});
