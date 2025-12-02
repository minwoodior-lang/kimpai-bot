import fs from "fs";
import path from "path";
import axios from "axios";

interface MasterSymbol {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string;
  cmcSlug?: string;
  isListed?: boolean;
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

    const masterSymbols = new Set(master.map((m) => m.base_symbol));
    const exchangeSymbols = new Set(markets.map((m) => m.base_symbol));

    console.log(`[Metadata] master: ${masterSymbols.size}, exchange: ${exchangeSymbols.size}`);

    const missing: string[] = [];
    for (const sym of exchangeSymbols) {
      if (!masterSymbols.has(sym)) {
        missing.push(sym);
      }
    }

    console.log(`[Metadata] Missing: ${missing.length}\n`);

    if (missing.length > 0) {
      console.log(`[Metadata] Fetching ${Math.min(missing.length, 10)} from CoinGecko...`);

      for (let i = 0; i < Math.min(missing.length, 10); i++) {
        const symbol = missing[i];
        try {
          const resp = await axios.get(`https://api.coingecko.com/api/v3/search?query=${symbol}`, {
            timeout: 5000,
          });

          if (resp.data?.coins?.[0]) {
            const coin = resp.data.coins[0];
            master.push({
              base_symbol: symbol,
              name_ko: null,
              name_en: coin.name || symbol,
              icon_url: `/coins/${symbol}.png`,
              cmcSlug: coin.id,
            });
            console.log(`  ✓ ${symbol}: ${coin.name}`);
          } else {
            master.push({
              base_symbol: symbol,
              name_ko: null,
              name_en: symbol,
              icon_url: `/coins/${symbol}.png`,
            });
          }
        } catch (e) {
          master.push({
            base_symbol: symbol,
            name_ko: null,
            name_en: symbol,
            icon_url: `/coins/${symbol}.png`,
          });
        }
      }
    }

    master.sort((a, b) => a.base_symbol.localeCompare(b.base_symbol));
    fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

    console.log(`\n✅ [syncMetadata] 완료: ${master.length}개 심볼`);
  } catch (e) {
    console.error("[syncMetadata] 오류:", e);
    process.exit(1);
  }
}

main();
