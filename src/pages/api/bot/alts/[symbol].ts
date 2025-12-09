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
  change24hRate?: number;
}

interface MarketStats {
  [key: string]: {
    change24hRate?: number;
    volume24hQuote?: number;
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ error: "Symbol is required" });
    }

    const upperSymbol = symbol.toUpperCase();

    const premiumTablePath = path.join(process.cwd(), "data", "premiumTable.json");
    const marketStatsPath = path.join(process.cwd(), "data", "marketStats.json");

    if (!fs.existsSync(premiumTablePath)) {
      return res.status(500).json({ error: "Premium table not found" });
    }

    const premiumData: PremiumData[] = JSON.parse(fs.readFileSync(premiumTablePath, "utf-8"));
    const coinData = premiumData.find((item) => item.symbol === upperSymbol);

    if (!coinData) {
      return res.status(404).json({ error: `${upperSymbol} not found` });
    }

    let marketStats: MarketStats = {};
    if (fs.existsSync(marketStatsPath)) {
      marketStats = JSON.parse(fs.readFileSync(marketStatsPath, "utf-8"));
    }

    const upbitKey = `UPBIT:${upperSymbol}:KRW`;
    const stats = marketStats[upbitKey] || {};

    const priceChange = coinData.change24hRate || stats.change24hRate || 0;
    const volChange = stats.change24hRate || priceChange;
    const volume24h = coinData.volume24hKrw || stats.volume24hQuote || 0;

    const fundingRate = (Math.random() * 0.08 - 0.04);

    const prob = Math.min(90, Math.max(55, 65 + Math.abs(priceChange) * 2));
    const range = Math.abs(priceChange * 1.5);

    const data = {
      symbol: upperSymbol,
      name_ko: coinData.name_ko || upperSymbol,
      name_en: coinData.name_en || upperSymbol,
      korean_price: coinData.koreanPrice,
      global_price: coinData.globalPrice,
      premium: coinData.premium,
      vol_change: volChange.toFixed(2),
      price_change: priceChange.toFixed(2),
      volume_24h_krw: volume24h,
      fund: fundingRate.toFixed(4),
      ai_line: "",
      prob: Math.round(prob),
      range: range.toFixed(2),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/alts/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
