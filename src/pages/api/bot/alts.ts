import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface PremiumData {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  usdKrw: number;
  volume24hKrw?: number;
  volume24hForeignKrw?: number;
  change24hRate?: number;
  change24hAbs?: number;
  high24h?: number;
  low24h?: number;
}

interface MarketStats {
  [key: string]: {
    change24hRate?: number;
    volume24hQuote?: number;
    high24h?: number;
    low24h?: number;
  };
}

const EXCLUDED_SYMBOLS = ["USDT", "USDC", "DAI", "BUSD", "USDP", "FRAX", "LUSD", "MIM", "OUSD", "USH", "UUSD", "WBTC", "GOHM", "FRXETH", "STVETH", "BTC", "ETH"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { limit = "50", sort = "volume" } = req.query;
    const limitNum = Math.min(Number(limit), 100);

    const premiumTablePath = path.join(process.cwd(), "data", "premiumTable.json");
    const marketStatsPath = path.join(process.cwd(), "data", "marketStats.json");

    if (!fs.existsSync(premiumTablePath)) {
      return res.status(500).json({ error: "Premium table not found" });
    }

    const premiumData: PremiumData[] = JSON.parse(fs.readFileSync(premiumTablePath, "utf-8"));
    
    let marketStats: MarketStats = {};
    if (fs.existsSync(marketStatsPath)) {
      marketStats = JSON.parse(fs.readFileSync(marketStatsPath, "utf-8"));
    }

    const altCoins = premiumData
      .filter((item) => !EXCLUDED_SYMBOLS.includes(item.symbol))
      .map((item) => {
        const upbitKrwKey = `UPBIT:${item.symbol}:KRW`;
        const stats = marketStats[upbitKrwKey] || {};

        const volChange = stats.change24hRate || item.change24hRate || 0;
        const priceChange = item.change24hRate || 0;
        const volume24h = item.volume24hKrw || stats.volume24hQuote || 0;

        const fundingRate = (Math.random() * 0.1 - 0.05);

        const volatility = Math.abs(priceChange) + Math.abs(volChange * 0.1);

        return {
          symbol: item.symbol,
          name_ko: item.name_ko || item.symbol,
          name_en: item.name_en || item.symbol,
          korean_price: item.koreanPrice,
          global_price: item.globalPrice,
          premium: item.premium,
          vol_change: volChange.toFixed(2),
          price_change: priceChange.toFixed(2),
          volume_24h_krw: volume24h,
          fund: fundingRate.toFixed(4),
          ai_line: "",
          prob: Math.min(90, Math.max(55, 65 + Math.abs(priceChange) * 2)),
          range: Math.abs(priceChange * 1.5).toFixed(2),
          volatility_score: volatility,
        };
      });

    let sortedAlts;
    if (sort === "volatility") {
      sortedAlts = altCoins.sort((a, b) => b.volatility_score - a.volatility_score);
    } else if (sort === "premium") {
      sortedAlts = altCoins.sort((a, b) => Math.abs(b.premium) - Math.abs(a.premium));
    } else {
      sortedAlts = altCoins.sort((a, b) => b.volume_24h_krw - a.volume_24h_krw);
    }

    const result = sortedAlts.slice(0, limitNum).map((alt) => ({
      symbol: alt.symbol,
      name_ko: alt.name_ko,
      name_en: alt.name_en,
      korean_price: alt.korean_price,
      global_price: alt.global_price,
      premium: alt.premium,
      vol_change: alt.vol_change,
      price_change: alt.price_change,
      fund: alt.fund,
      ai_line: alt.ai_line,
      prob: Math.round(alt.prob),
      range: alt.range,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("/api/bot/alts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
