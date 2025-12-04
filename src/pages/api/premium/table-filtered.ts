import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

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

function loadPremiumTable(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "premiumTable.json");
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
    const premiumTable = loadPremiumTable();

    const filtered = allMarkets
      .filter((m) => {
        const matchExchange = m.exchange === domesticExchange;
        const matchQuote = m.quote === domesticQuote;
        return matchExchange && matchQuote;
      })
      .map((market) => {
        const symbol = market.base.toUpperCase();
        const master = masterSymbols.find(
          (s) => s.base_symbol === symbol || s.symbol === symbol
        );
        const premiumRow = premiumTable.find((p: any) => p.symbol === symbol);

        const shouldForcePlaceholder = BAD_ICON_SYMBOLS.includes(symbol);
        const baseIconUrl = master?.icon_path || null;
        const iconUrl = shouldForcePlaceholder ? null : baseIconUrl;

        // cmcSlug 우선순위
        const cmcSlug =
          premiumRow?.cmcSlug || market?.cmcSlug || master?.cmc_slug || null;

        // 디버깅: BTC, ETH, LINK만 로그
        if (["BTC", "ETH", "LINK"].includes(symbol)) {
          console.log("[CMC_DEBUG]", {
            symbol,
            premiumTableSlug: premiumRow?.cmcSlug,
            marketSlug: market?.cmcSlug,
            masterSlug: master?.cmc_slug,
            finalSlug: cmcSlug,
          });
        }

        return {
          symbol,
          name_ko: market.name_ko || master?.name_ko || market.base,
          name_en: market.name_en || master?.name_en || market.base,
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
          icon_url: iconUrl,
          displayName: market.name_ko || market.name_en || market.base,
          cmcSlug: cmcSlug,
        };
      })
      .sort((a, b) => (b.volume24hKrw || 0) - (a.volume24hKrw || 0));

    return res.status(200).json({
      success: true,
      data: filtered,
      averagePremium: filtered.length
        ? filtered.reduce((sum, r) => sum + (r.premium || 0), 0) / filtered.length
        : 0,
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
