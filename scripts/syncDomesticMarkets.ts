import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  exchange: string;
  market_symbol: string;
  base_symbol: string;
  quote_symbol: string;
  market_type: string;
  is_active: boolean;
}

interface MasterSymbol {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string;
  cmcSlug?: string;
  isListed?: boolean;
}

const markets: ExchangeMarket[] = [];
const metadataMap: Record<string, Partial<MasterSymbol>> = {};

// ========== Upbit ==========
async function syncUpbit() {
  try {
    console.log("[Upbit] Syncing markets & metadata...");
    const resp = await axios.get("https://api.upbit.com/v1/market/all?isDetails=true", {
      timeout: 10000,
    });

    const seen = new Set<string>();
    let count = 0;

    for (const m of resp.data) {
      const market: string = m.market;
      const korean_name: string = m.korean_name || "";
      const english_name: string = m.english_name || "";

      if (!market) continue;

      const [quote, base] = market.split("-");
      if (!base || !quote) continue;

      const key = `UPBIT_${quote}_${base}`;
      if (!seen.has(key)) {
        seen.add(key);
        markets.push({
          exchange: "UPBIT",
          market_symbol: market,
          base_symbol: base,
          quote_symbol: quote,
          market_type: "spot",
          is_active: true,
        });

        // 메타데이터 수집
        if (!metadataMap[base]) {
          metadataMap[base] = {
            base_symbol: base,
            name_ko: korean_name || null,
            name_en: english_name || null,
            icon_url: `/coins/${base}.png`,
          };
        } else {
          if (!metadataMap[base].name_ko && korean_name) {
            metadataMap[base].name_ko = korean_name;
          }
          if (!metadataMap[base].name_en && english_name) {
            metadataMap[base].name_en = english_name;
          }
        }
        count++;
      }
    }

    console.log(`  ✓ Upbit: ${count} markets & metadata`);
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
  }
}

// ========== Bithumb ==========
async function syncBithumb() {
  try {
    console.log("[Bithumb] Syncing KRW/BTC/USDT markets...");
    const quotes = ["KRW", "BTC", "USDT"];
    let count = 0;

    for (const quote of quotes) {
      try {
        const endpoint = quote === "KRW" ? "ALL_KRW" : `ALL_${quote}`;
        const resp = await axios.get(
          `https://api.bithumb.com/public/ticker/${endpoint}`,
          { timeout: 8000 },
        );

        if (resp.data?.data) {
          for (const base in resp.data.data) {
            if (base === "date") continue;

            const key = `BITHUMB_${quote}_${base}`;
            const market_symbol = `${base}_${quote}`;

            markets.push({
              exchange: "BITHUMB",
              market_symbol,
              base_symbol: base.toUpperCase(),
              quote_symbol: quote,
              market_type: "spot",
              is_active: true,
            });

            // 빗썸에서 메타데이터 추출
            const ticker = resp.data.data[base];
            if (!metadataMap[base.toUpperCase()]) {
              metadataMap[base.toUpperCase()] = {
                base_symbol: base.toUpperCase(),
                name_ko: null,
                name_en: null,
                icon_url: `/coins/${base.toUpperCase()}.png`,
              };
            }
            count++;
          }
        }
      } catch (e) {
        console.log(`  ⚠ Bithumb ${quote}: ${(e as any).message}`);
      }
    }

    console.log(`  ✓ Bithumb: ${count} markets`);
  } catch (e) {
    console.error(`[Bithumb] Error: ${(e as any).message}`);
  }
}

// ========== Coinone ==========
async function syncCoinone() {
  try {
    console.log("[Coinone] Syncing markets...");
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });

    let count = 0;

    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;

        const marketSymbol = `KRW-${base}`;
        markets.push({
          exchange: "COINONE",
          market_symbol: marketSymbol,
          base_symbol: base.toUpperCase(),
          quote_symbol: "KRW",
          market_type: "spot",
          is_active: true,
        });

        if (!metadataMap[base.toUpperCase()]) {
          metadataMap[base.toUpperCase()] = {
            base_symbol: base.toUpperCase(),
            name_ko: null,
            name_en: null,
            icon_url: `/coins/${base.toUpperCase()}.png`,
          };
        }
        count++;
      }
    }

    console.log(`  ✓ Coinone: ${count} markets`);
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }
}

// Remove duplicates
function deduplicateMarkets(markets: ExchangeMarket[]): ExchangeMarket[] {
  const seen = new Map<string, ExchangeMarket>();

  for (const m of markets) {
    const key = `${m.exchange}_${m.base_symbol}_${m.quote_symbol}`;
    if (!seen.has(key)) {
      seen.set(key, m);
    }
  }

  return Array.from(seen.values());
}

async function main() {
  console.log("[syncDomesticMarkets] 시작\n");

  await Promise.all([syncUpbit(), syncBithumb(), syncCoinone()]);

  const deduped = deduplicateMarkets(markets);

  // Save exchange_markets.json
  const marketsPath = path.join(process.cwd(), "data", "exchange_markets.json");
  fs.writeFileSync(marketsPath, JSON.stringify(deduped, null, 2));

  console.log(`\n✅ [syncDomesticMarkets] 완료:`);
  console.log(`   - exchange_markets.json: ${deduped.length}개 마켓`);
  console.log(`   - 메타데이터: ${Object.keys(metadataMap).length}개 심볼\n`);
}

main().catch((e) => {
  console.error("[syncDomesticMarkets] 오류:", e);
  process.exit(1);
});
