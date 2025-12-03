import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

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

function loadExchangeIcons(): Record<string, string> {
  try {
    const file = path.join(process.cwd(), "data", "exchangeIcons.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return {};
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { domestic = "UPBIT_KRW", foreign = "BINANCE_BTC" } = req.query;

    // Parse domestic exchange
    const domesticParts = (domestic as string).split("_");
    const domesticExchange = domesticParts[0];
    const domesticQuote = domesticParts.slice(1).join("_");

    // Parse foreign exchange
    const foreignParts = (foreign as string).split("_");
    const foreignExchange = foreignParts[0];
    const foreignQuote = foreignParts.slice(1).join("_");

    const allMarkets = loadExchangeMarkets();
    const masterSymbols = loadMasterSymbols();
    const exchangeIcons = loadExchangeIcons();

    console.log(
      `[API] Filtering: domestic=${domesticExchange}_${domesticQuote}, foreign=${foreignExchange}_${foreignQuote}`
    );

    // Filter markets by exchange and quote
    const filtered = allMarkets
      .filter((m) => {
        const matchExchange = m.exchange === domesticExchange;
        const matchQuote = m.quote === domesticQuote;
        return matchExchange && matchQuote;
      })
      .map((market) => {
        const symbol = market.base.toUpperCase();
        const master = masterSymbols.find((s) => s.symbol === symbol);
        
        // 거래소:심볼 기준으로 정확한 아이콘 경로 조회
        const exchangeIconKey = `${market.exchange}:${symbol}`;
        const baseIconUrl = exchangeIcons[exchangeIconKey] || null;
        
        // BAD_ICON_SYMBOLS 에 포함된 심볼은 강제로 icon_url = null 처리
        const shouldForcePlaceholder = BAD_ICON_SYMBOLS.includes(symbol);
        const iconUrl = shouldForcePlaceholder ? null : baseIconUrl;

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
        };
      })
      .sort((a, b) => (b.volume24hKrw || 0) - (a.volume24hKrw || 0));

    console.log(`[API] Filtered result: ${filtered.length} items`);

    return res.status(200).json({
      success: true,
      data: filtered,
      averagePremium: filtered.length
        ? filtered.reduce((sum, r) => sum + (r.premium || 0), 0) /
          filtered.length
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
