import fs from "fs";
import path from "path";
import axios from "axios";

interface MasterSymbol {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string;
}

interface ExchangeMarket {
  base_symbol: string;
}

async function main() {
  console.log("[syncMetadata] 시작\n");

  try {
    const masterPath = path.join(process.cwd(), "data", "master_symbols.json");
    let master: MasterSymbol[] = [];
    if (fs.existsSync(masterPath)) {
      master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    }

    const marketsPath = path.join(process.cwd(), "data", "exchange_markets.json");
    const markets: ExchangeMarket[] = JSON.parse(fs.readFileSync(marketsPath, "utf8"));

    const masterMap = new Map(master.map((m) => [m.base_symbol, m]));
    const exchangeSymbols = Array.from(new Set(markets.map((m) => m.base_symbol)));

    console.log(`[Metadata] master: ${masterMap.size}, exchange: ${exchangeSymbols.length}`);

    const missing: string[] = [];
    for (const sym of exchangeSymbols) {
      if (!masterMap.has(sym)) {
        missing.push(sym);
      }
    }

    console.log(`[Metadata] Missing: ${missing.length}\n`);

    if (missing.length > 0) {
      console.log(`[Metadata] Fetching ${Math.min(missing.length, 20)} from CoinGecko...`);

      for (let i = 0; i < Math.min(missing.length, 20); i++) {
        const symbol = missing[i];
        try {
          const resp = await axios.get(`https://api.coingecko.com/api/v3/search?query=${symbol}`, {
            timeout: 5000,
          });

          if (resp.data?.coins?.[0]) {
            const coin = resp.data.coins[0];
            masterMap.set(symbol, {
              base_symbol: symbol,
              name_ko: null,
              name_en: coin.name || symbol,
              icon_url: `/coins/${symbol}.png`,
            });
            console.log(`  ✓ ${symbol}: ${coin.name}`);
          } else {
            masterMap.set(symbol, {
              base_symbol: symbol,
              name_ko: null,
              name_en: symbol,
              icon_url: `/coins/${symbol}.png`,
            });
          }
        } catch (e) {
          masterMap.set(symbol, {
            base_symbol: symbol,
            name_ko: null,
            name_en: symbol,
            icon_url: `/coins/${symbol}.png`,
          });
        }
      }
    }

    const result = Array.from(masterMap.values()).sort((a, b) =>
      a.base_symbol.localeCompare(b.base_symbol)
    );

    fs.writeFileSync(masterPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ [syncMetadata] 완료: ${result.length}개 심볼\n`);
  } catch (e) {
    console.error("[syncMetadata] 오류:", e);
    process.exit(1);
  }
}

main();
