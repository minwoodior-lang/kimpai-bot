import fs from "fs";
import path from "path";
import axios from "axios";

interface ExchangeMarket {
  exchange: string;
  market_symbol: string;
  base_symbol: string;
  quote_symbol: string;
  is_active?: boolean;
}

interface PremiumRow {
  symbol: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  domesticExchange: string | null;
  foreignExchange: string | null;
}

const FX_DEFAULT = 1350;

function loadExchangeMarkets(): ExchangeMarket[] {
  const filePath = path.join(process.cwd(), "data", "exchange_markets.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return json as ExchangeMarket[];
}

async function fetchUpbitTickers(markets: string[]) {
  if (!markets.length) return {};
  const url = `https://api.upbit.com/v1/ticker?markets=${markets.join(",")}`;
  const { data } = await axios.get(url);
  const result: Record<string, any> = {};
  for (const row of data) result[row.market] = row;
  return result;
}

async function fetchOkxTicker(instId: string) {
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${instId}`;
  const { data } = await axios.get(url);
  return data?.data?.[0] || null;
}

async function main() {
  console.log("[priceWorker] start");

  const markets = loadExchangeMarkets().filter((m) => m.is_active ?? true);

  const upbitKrwMarkets = markets.filter(
    (m) => m.exchange === "UPBIT" && m.quote_symbol === "KRW"
  );

  const upbitIds = upbitKrwMarkets.map((m) => m.market_symbol);
  const upbitTickers = await fetchUpbitTickers(upbitIds);

  const okxUsdtMarkets = markets.filter(
    (m) => m.exchange === "OKX" && m.quote_symbol === "USDT"
  );

  const rows: PremiumRow[] = [];

  for (const m of upbitKrwMarkets) {
    const base = m.base_symbol.toUpperCase();
    const upbitTicker = upbitTickers[m.market_symbol];
    const koreanPrice = upbitTicker ? Number(upbitTicker.trade_price) : null;

    let globalPrice: number | null = null;
    let globalPriceKrw: number | null = null;
    const okxMarket = okxUsdtMarkets.find(
      (om) => om.base_symbol.toUpperCase() === base
    );

    if (okxMarket) {
      const ticker = await fetchOkxTicker(okxMarket.market_symbol);
      if (ticker?.last) {
        globalPrice = Number(ticker.last);
        globalPriceKrw = globalPrice * FX_DEFAULT;
      }
    }

    let premium: number | null = null;
    if (koreanPrice && globalPriceKrw) {
      premium = ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
    }

    rows.push({
      symbol: base,
      koreanPrice,
      globalPrice,
      globalPriceKrw,
      premium,
      domesticExchange: "UPBIT",
      foreignExchange: okxMarket ? "OKX" : null,
    });
  }

  const outPath = path.join(process.cwd(), "data", "premiumTable.json");
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

  console.log(`[priceWorker] done. count=${rows.length}`);
}

main().catch((err) => {
  console.error("[priceWorker] error:", err);
  process.exit(1);
});
