import fs from "fs";
import path from "path";
import axios from "axios";

interface Market {
  exchange: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  market?: string;
}

interface PremiumEntry {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  koreanPrice?: number;
  globalPrice?: number;
  globalPriceKrw?: number;
  premium?: number;
  volume24hKrw?: number;
  volume24hUsdt?: number;
  volume24hForeignKrw?: number;
  change24h?: number;
  domesticExchange?: string;
  foreignExchange?: string;
}

const FX_RATE = 1330;

async function fetchOKXPrice(symbol: string): Promise<{ price: number; volume: number } | null> {
  try {
    const response = await axios.get(
      `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT`,
      { timeout: 5000 }
    );

    if (response.data?.data?.[0]) {
      const data = response.data.data[0];
      return {
        price: parseFloat(data.last || data.markPx || 0),
        volume: parseFloat(data.volCcy24h || 0),
      };
    }
  } catch (e) {
    console.error(`Failed to fetch OKX price for ${symbol}:`, (e as Error).message);
  }

  return null;
}

async function buildPremiumTable() {
  const exchangeMarketsPath = path.join(process.cwd(), "data", "exchange_markets.json");
  const markets = JSON.parse(fs.readFileSync(exchangeMarketsPath, "utf-8")) as Market[];

  const symbolMap = new Map<string, Map<string, Market>>();

  for (const market of markets) {
    const symbol = market.base.toUpperCase();
    if (!symbolMap.has(symbol)) {
      symbolMap.set(symbol, new Map());
    }
    const exchangeMap = symbolMap.get(symbol)!;
    if (!exchangeMap.has(market.exchange)) {
      exchangeMap.set(market.exchange, market);
    }
  }

  const premiumTable: PremiumEntry[] = [];

  for (const [symbol, exchangeMap] of Array.from(symbolMap.entries()).sort()) {
    const nameKo = Array.from(exchangeMap.values()).find((m) => m.name_ko)?.name_ko;
    const nameEn = Array.from(exchangeMap.values()).find((m) => m.name_en)?.name_en;

    const upbitMarket = exchangeMap.get("UPBIT");
    const bithumbMarket = exchangeMap.get("BITHUMB");
    const coinoneMarket = exchangeMap.get("COINONE");

    const koreanPrice = upbitMarket || bithumbMarket || coinoneMarket;
    const domesticExchange = upbitMarket ? "UPBIT" : bithumbMarket ? "BITHUMB" : "COINONE";

    const globalPriceData = await fetchOKXPrice(symbol);

    if (globalPriceData && koreanPrice) {
      const globalPrice = globalPriceData.price;
      const globalPriceKrw = globalPrice * FX_RATE;
      const premium = ((1330 - globalPriceKrw) / globalPriceKrw) * 100;

      const entry: PremiumEntry = {
        symbol,
        domesticExchange,
        foreignExchange: "OKX",
      };

      if (nameKo) entry.name_ko = nameKo;
      if (nameEn) entry.name_en = nameEn;
      if (koreanPrice) entry.koreanPrice = 1330;
      if (globalPrice) entry.globalPrice = globalPrice;
      if (globalPriceKrw) entry.globalPriceKrw = globalPriceKrw;
      if (premium) entry.premium = premium;
      if (globalPriceData.volume) entry.volume24hUsdt = globalPriceData.volume;

      premiumTable.push(entry);
    }
  }

  const outputPath = path.join(process.cwd(), "data", "premiumTable.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(premiumTable, null, 2), "utf-8");

  console.log(`✅ premiumTable.json 생성 완료: ${premiumTable.length}개 항목`);
  return premiumTable;
}

buildPremiumTable().catch((e) => {
  console.error("❌ buildPremiumTable failed:", e);
  process.exit(1);
});
