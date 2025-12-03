import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PremiumRow {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  exchange: string;
  market: string;
  base: string;
  quote: string;
  koreanPrice?: number;
  globalPrice?: number;
  globalPriceKrw?: number;
  premium?: number;
  volume24hKrw?: number;
  volume24hUsdt?: number;
  volume24hForeignKrw?: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  isDomestic?: boolean;
}

function loadExchangeMarkets(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "exchange_markets.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function loadMasterSymbols(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "master_symbols.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { domestic = "UPBIT_KRW", foreign = "BINANCE_BTC" } = req.query;

    const domesticParts = (domestic as string).split("_");
    const domesticExchange = domesticParts[0];
    const domesticQuote = domesticParts.slice(1).join("_");

    const foreignParts = (foreign as string).split("_");
    const foreignExchange = foreignParts[0];
    const foreignQuote = foreignParts.slice(1).join("_");

    const allMarkets = loadExchangeMarkets();
    const masterSymbols = loadMasterSymbols();

    const filtered = allMarkets
      .filter(
        (m) =>
          m.exchange === domesticExchange && m.quote === domesticQuote
      )
      .map((market) => {
        const master = masterSymbols.find(
          (s) => s.symbol === market.base.toUpperCase()
        );

        return {
          symbol: market.base.toUpperCase(),
          name_ko: market.name_ko || master?.name_ko,
          name_en: market.name_en || master?.name_en,
          market: market.market,
          exchange: market.exchange,
          quote: market.quote,
          domesticExchange: market.exchange,
          foreignExchange: foreignExchange,
          koreanPrice: market.koreanPrice || 1,
          globalPrice: market.globalPrice || 1,
          globalPriceKrw: market.globalPriceKrw || 1,
          premium: market.premium || 0,
          volume24hKrw: market.volume24hKrw || 0,
          volume24hUsdt: market.volume24hUsdt || 0,
          volume24hForeignKrw: market.volume24hForeignKrw || 0,
          change24h: market.change24h || 0,
          isListed: true,
          icon_url: master?.icon_path || null,
        };
      });

    return res.status(200).json({
      success: true,
      data: filtered,
      averagePremium: 0,
      fxRate: 1330,
      updatedAt: new Date().toISOString(),
      domesticExchange,
      foreignExchange,
      totalCoins: filtered.length,
      listedCoins: filtered.length,
    });
  } catch (err) {
    console.error("[API] /premium/table-filtered error:", err);
    return res.status(500).json({
      success: false,
      data: [],
      averagePremium: 0,
      fxRate: 1330,
      updatedAt: new Date().toISOString(),
      totalCoins: 0,
      listedCoins: 0,
    });
  }
}
