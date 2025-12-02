import fs from "fs";
import path from "path";

function loadJson<T>(p: string): T {
  const full = path.join(process.cwd(), p);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

type Market = {
  base_symbol: string;
  exchange?: string;
  quote_symbol?: string;
};

type SymbolMeta = {
  base_symbol: string;
};

type PremiumRow = {
  symbol: string;
};

function main() {
  const markets: Market[] = loadJson("data/exchange_markets.json");
  const metas: SymbolMeta[] = loadJson("data/master_symbols.json");
  const premium: PremiumRow[] = loadJson("data/premiumTable.json");

  // base_symbol 집합 추출
  const marketSymbols = new Set(
    markets.map((m) => m.base_symbol).filter(Boolean)
  );
  const metaSymbols = new Set(
    metas.map((m) => m.base_symbol).filter(Boolean)
  );
  const premiumSymbols = new Set(
    premium.map((p: any) => p.symbol).filter(Boolean)
  );

  // 국내 거래소 마켓만 추출
  const domesticMarkets = markets.filter(
    (m) =>
      (m.exchange === "UPBIT" || m.exchange === "BITHUMB" || m.exchange === "COINONE") &&
      (m.quote_symbol === "KRW" || m.quote_symbol === "BTC" || m.quote_symbol === "USDT")
  );
  const domesticSymbols = new Set(
    domesticMarkets.map((m) => m.base_symbol).filter(Boolean)
  );

  console.log("\n=== 📊 Coverage Check Report ===\n");

  console.log("1️⃣ Counts");
  console.log(`   - exchange_markets unique base_symbol: ${marketSymbols.size}`);
  console.log(`   - master_symbols base_symbol: ${metaSymbols.size}`);
  console.log(`   - premiumTable symbol: ${premiumSymbols.size}`);
  console.log(`   - Domestic markets (Upbit/Bithumb/Coinone) base_symbol: ${domesticSymbols.size}`);

  // Domestic markets에 있는데 master_symbols에 없는 심볼
  const domesticNotInMeta = [...domesticSymbols].filter(
    (s) => !metaSymbols.has(s)
  );

  // exchange_markets에 있는데 master_symbols에 없는 심볼
  const marketNotInMeta = [...marketSymbols].filter(
    (s) => !metaSymbols.has(s)
  );

  // exchange_markets에 있는데 premiumTable에 없는 심볼
  const marketNotInPremium = [...marketSymbols].filter(
    (s) => !premiumSymbols.has(s)
  );

  // Domestic에 있는데 premiumTable에 없는 심볼
  const domesticNotInPremium = [...domesticSymbols].filter(
    (s) => !premiumSymbols.has(s)
  );

  console.log("\n2️⃣ Domestic Market Coverage");
  if (domesticNotInMeta.length === 0) {
    console.log("   ✅ All domestic markets exist in master_symbols");
  } else {
    console.log(`   ⚠️  Domestic markets missing in master_symbols (${domesticNotInMeta.length}):`);
    console.log(`   ${domesticNotInMeta.sort()}`);
  }

  if (domesticNotInPremium.length === 0) {
    console.log("   ✅ All domestic markets exist in premiumTable");
  } else {
    console.log(`   ⚠️  Domestic markets missing in premiumTable (${domesticNotInPremium.length}):`);
    console.log(`   ${domesticNotInPremium.sort()}`);
  }

  console.log("\n3️⃣ All Markets Coverage");
  if (marketNotInMeta.length === 0) {
    console.log("   ✅ All exchange markets exist in master_symbols");
  } else {
    console.log(`   ⚠️  Markets missing in master_symbols (${marketNotInMeta.length}):`);
    console.log(`   ${marketNotInMeta.sort()}`);
  }

  if (marketNotInPremium.length === 0) {
    console.log("   ✅ All exchange markets exist in premiumTable");
  } else {
    console.log(`   ⚠️  Markets missing in premiumTable (${marketNotInPremium.length}):`);
    console.log(`   ${marketNotInPremium.sort()}`);
  }

  console.log("\n4️⃣ Domestic Market Details");
  console.log(`   Symbols: ${[...domesticSymbols].sort().join(", ")}`);

  console.log("\n=== End Report ===\n");
}

main();
