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

interface MasterSymbol {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  icon_path?: string;
}

interface PremiumEntry {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  icon_url?: string | null;
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
  const masterSymbolsPath = path.join(process.cwd(), "data", "master_symbols.json");
  
  const markets = JSON.parse(fs.readFileSync(exchangeMarketsPath, "utf-8")) as Market[];
  
  // 1) master_symbols 불러오기
  let masterSymbolsList: MasterSymbol[] = [];
  try {
    masterSymbolsList = JSON.parse(fs.readFileSync(masterSymbolsPath, "utf-8")) as MasterSymbol[];
  } catch (e) {
    console.warn("⚠ master_symbols.json not found, proceeding without icons");
  }
  
  // 2) 심볼 → 아이콘 맵 생성
  const iconMap = new Map<string, string>();
  for (const ms of masterSymbolsList) {
    if (ms.symbol && ms.icon_path) {
      iconMap.set(ms.symbol.toUpperCase(), ms.icon_path);
    }
  }

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

      // 3) master_symbols에서 icon_url 가져오기
      const iconUrl = iconMap.get(symbol) ?? null;

      const entry: PremiumEntry = {
        symbol,
        domesticExchange,
        foreignExchange: "OKX",
        icon_url: iconUrl,
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
