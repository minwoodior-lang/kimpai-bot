import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

function loadJsonFile(filename: string): any {
  try {
    const file = path.join(process.cwd(), "data", filename);
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return filename.endsWith('.json') ? [] : {};
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { domestic = "UPBIT_KRW", foreign = "OKX_USDT" } = req.query;

    const domesticParts = (domestic as string).split("_");
    const domesticExchange = domesticParts[0];
    const domesticQuote = domesticParts.slice(1).join("_");

    const foreignParts = (foreign as string).split("_");
    const foreignExchange = foreignParts[0];
    const foreignQuote = foreignParts.slice(1).join("_");

    const allMarkets = loadJsonFile("exchange_markets.json") as any[];
    const masterSymbols = loadJsonFile("master_symbols.json") as any[];
    const premiumTable = loadJsonFile("premiumTable.json") as any[];
    const prices = loadJsonFile("prices.json") as Record<string, { price: number; ts: number }>;

    const masterMap = new Map(masterSymbols.map((s: any) => [s.symbol, s]));
    const premiumMap = new Map(premiumTable.map((p: any) => [p.symbol, p]));

    const fxRate = premiumTable[0]?.usdKrw || 1380;

    const filtered = allMarkets
      .filter((m) => {
        const matchExchange = m.exchange === domesticExchange;
        const matchQuote = m.quote === domesticQuote;
        return matchExchange && matchQuote;
      })
      .map((market) => {
        const symbol = market.base.toUpperCase();
        const master = masterMap.get(symbol);
        const premiumRow = premiumMap.get(symbol);

        const domesticPriceKey = `${domesticExchange}:${symbol}:${domesticQuote}`;
        const foreignPriceKey = `${foreignExchange}:${symbol}:${foreignQuote}`;

        const domesticPrice = prices[domesticPriceKey]?.price || 0;
        const foreignPrice = prices[foreignPriceKey]?.price || 0;

        let premium = 0;
        let globalPriceKrw = 0;

        if (domesticPrice > 0 && foreignPrice > 0) {
          if (foreignQuote === "USDT") {
            globalPriceKrw = foreignPrice * fxRate;
          } else if (foreignQuote === "BTC") {
            const btcPriceOrder = ["BINANCE:BTC:USDT", "OKX:BTC:USDT", "BITGET:BTC:USDT", "GATE:BTC:USDT", "MEXC:BTC:USDT"];
            let btcUsdtPrice = 0;
            for (const key of btcPriceOrder) {
              if (prices[key]?.price) {
                btcUsdtPrice = prices[key].price;
                break;
              }
            }
            globalPriceKrw = foreignPrice * btcUsdtPrice * fxRate;
          } else {
            globalPriceKrw = foreignPrice;
          }

          if (globalPriceKrw > 0) {
            premium = ((domesticPrice - globalPriceKrw) / globalPriceKrw) * 100;
          }
        }

        const shouldForcePlaceholder = BAD_ICON_SYMBOLS.includes(symbol);
        const baseIconUrl = master?.icon_path || premiumRow?.iconUrl || null;
        const iconUrl = shouldForcePlaceholder ? null : baseIconUrl;

        const cmcSlug = premiumRow?.cmcSlug || master?.cmc_slug || null;

        return {
          symbol,
          name_ko: market.name_ko || master?.name_ko || premiumRow?.name_ko || symbol,
          name_en: market.name_en || master?.name_en || premiumRow?.name_en || symbol,
          market: market.market,
          exchange: market.exchange,
          quote: market.quote,
          domesticExchange: domesticExchange,
          foreignExchange: foreignExchange,
          koreanPrice: domesticPrice,
          globalPrice: foreignPrice,
          globalPriceKrw: Math.round(globalPriceKrw * 100) / 100,
          premium: Math.round(premium * 100) / 100,
          volume24hKrw: 0,
          volume24hUsdt: 0,
          volume24hForeignKrw: 0,
          change24h: 0,
          isListed: domesticPrice > 0 && foreignPrice > 0,
          icon_url: iconUrl,
          displayName: market.name_ko || market.name_en || symbol,
          cmcSlug: cmcSlug,
        };
      })
      .filter((row) => row.koreanPrice > 0)
      .sort((a, b) => b.premium - a.premium);

    const avgPremium = filtered.length > 0
      ? filtered.reduce((sum, r) => sum + r.premium, 0) / filtered.length
      : 0;

    return res.status(200).json({
      success: true,
      data: filtered,
      averagePremium: Math.round(avgPremium * 100) / 100,
      fxRate: fxRate,
      updatedAt: new Date().toISOString(),
      domesticExchange,
      foreignExchange,
      totalCoins: filtered.length,
      listedCoins: filtered.filter(r => r.isListed).length,
    });
  } catch (err) {
    console.error("[API] /premium/table-filtered error:", err);
    return res.status(500).json({
      success: false,
      data: [],
      averagePremium: 0,
      fxRate: 1380,
      updatedAt: new Date().toISOString(),
      totalCoins: 0,
      listedCoins: 0,
    });
  }
}
