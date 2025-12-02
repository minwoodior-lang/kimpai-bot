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

// 심볼 정규화: KRW-BTC → BTC, USDT_ETH → ETH
function normalizeSymbol(symbol: string): string {
  return symbol
    .replace(/^(KRW|USDT|BTC)[-_]/, "") // 앞의 quote 제거
    .replace(/[-_].*$/, "") // 뒤의 quote 제거
    .toUpperCase();
}

const markets: ExchangeMarket[] = [];
const seenMarkets = new Set<string>();

function addMarket(
  exchange: string,
  market_symbol: string,
  base_symbol: string,
  quote_symbol: string
) {
  const key = `${exchange}_${base_symbol}_${quote_symbol}`;
  if (!seenMarkets.has(key)) {
    seenMarkets.add(key);
    markets.push({
      exchange,
      market_symbol,
      base_symbol,
      quote_symbol,
      market_type: "spot",
      is_active: true,
    });
  }
}

// ========== Upbit ==========
async function syncUpbit() {
  try {
    console.log("[Upbit] Syncing...");
    const resp = await axios.get("https://api.upbit.com/v1/market/all?isDetails=true", {
      timeout: 10000,
    });

    let count = 0;
    for (const m of resp.data) {
      const market: string = m.market;
      if (!market) continue;

      const [quote, base] = market.split("-");
      if (!base || !quote) continue;

      addMarket("UPBIT", market, base, quote);
      count++;
    }
    console.log(`  ✓ Upbit: ${count} markets`);
  } catch (e) {
    console.error(`[Upbit] Error: ${(e as any).message}`);
  }
}

// ========== Bithumb ==========
async function syncBithumb() {
  try {
    console.log("[Bithumb] Syncing KRW/BTC/USDT...");
    const quotes = ["KRW", "BTC", "USDT"];
    let count = 0;

    for (const quote of quotes) {
      try {
        const endpoint = quote === "KRW" ? "ALL_KRW" : `ALL_${quote}`;
        const resp = await axios.get(
          `https://api.bithumb.com/public/ticker/${endpoint}`,
          { timeout: 8000 }
        );

        if (resp.data?.data) {
          for (const base in resp.data.data) {
            if (base === "date") continue;
            const baseNorm = normalizeSymbol(base);
            const marketSymbol = `${baseNorm}_${quote}`;
            addMarket("BITHUMB", marketSymbol, baseNorm, quote);
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
    console.log("[Coinone] Syncing...");
    const resp = await axios.get("https://api.coinone.co.kr/ticker?currency=all", {
      timeout: 8000,
    });

    let count = 0;
    if (resp.data?.result === 1) {
      for (const base in resp.data) {
        if (!base || base.startsWith("timestamp") || base === "result") continue;
        const baseNorm = normalizeSymbol(base);
        const marketSymbol = `${baseNorm}-KRW`;
        addMarket("COINONE", marketSymbol, baseNorm, "KRW");
        count++;
      }
    }
    console.log(`  ✓ Coinone: ${count} markets`);
  } catch (e) {
    console.error(`[Coinone] Error: ${(e as any).message}`);
  }
}

async function main() {
  console.log("[syncDomesticMarkets] 시작\n");

  await Promise.all([syncUpbit(), syncBithumb(), syncCoinone()]);

  const outPath = path.join(process.cwd(), "data", "exchange_markets.json");
  fs.writeFileSync(outPath, JSON.stringify(markets, null, 2));

  console.log(`\n✅ [syncDomesticMarkets] 완료: ${markets.length}개 마켓 (정규화됨)\n`);
}

main().catch((e) => {
  console.error("[syncDomesticMarkets] 오류:", e);
  process.exit(1);
});
