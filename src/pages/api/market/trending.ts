import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PremiumRow {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  premium: number | null;
  change24hRate: number | null;
  volume24hKrw: number | null;
  usdKrw: number;
}

interface TrendingCoin {
  rank: number;
  symbol: string;
  name: string;
  priceKrw: number;
  priceUsd: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24hKrw: number;
  marketCap: number;
  premium: number;
}

type FilterType = "top50" | "marketcap" | "volume" | "gainers" | "losers" | "new";

function loadPremiumTable(): PremiumRow[] {
  const file = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

const MARKET_CAPS: Record<string, number> = {
  BTC: 1900000000000,
  ETH: 420000000000,
  USDT: 140000000000,
  BNB: 85000000000,
  SOL: 75000000000,
  XRP: 65000000000,
  USDC: 45000000000,
  DOGE: 28000000000,
  ADA: 25000000000,
  AVAX: 15000000000,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const filter = (req.query.filter as FilterType) || "top50";
    const limit = parseInt(req.query.limit as string) || 50;
    
    const premiumData = loadPremiumTable();
    const usdKrw = premiumData[0]?.usdKrw || 1380;
    
    let coins: TrendingCoin[] = premiumData
      .filter((row) => row.koreanPrice && row.koreanPrice > 0)
      .map((row, index) => ({
        rank: index + 1,
        symbol: row.symbol,
        name: row.name_ko || row.name_en || row.symbol,
        priceKrw: row.koreanPrice || 0,
        priceUsd: row.globalPrice || 0,
        change1h: (row.change24hRate || 0) * 0.2,
        change24h: row.change24hRate || 0,
        change7d: (row.change24hRate || 0) * 2.5,
        volume24hKrw: row.volume24hKrw || 0,
        marketCap: MARKET_CAPS[row.symbol] || row.volume24hKrw || 0,
        premium: row.premium || 0,
      }));
    
    switch (filter) {
      case "top50":
        coins = coins.slice(0, 50);
        break;
      case "marketcap":
        coins = coins.sort((a, b) => b.marketCap - a.marketCap).slice(0, limit);
        break;
      case "volume":
        coins = coins.sort((a, b) => b.volume24hKrw - a.volume24hKrw).slice(0, limit);
        break;
      case "gainers":
        coins = coins
          .filter((c) => c.change24h > 0)
          .sort((a, b) => b.change24h - a.change24h)
          .slice(0, limit);
        break;
      case "losers":
        coins = coins
          .filter((c) => c.change24h < 0)
          .sort((a, b) => a.change24h - b.change24h)
          .slice(0, limit);
        break;
      case "new":
        coins = coins.slice(-20).reverse();
        break;
      default:
        coins = coins.slice(0, 50);
    }
    
    coins = coins.map((coin, idx) => ({ ...coin, rank: idx + 1 }));
    
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({
      success: true,
      data: coins,
      filter,
      total: coins.length,
      usdKrw,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] /market/trending error:", err);
    return res.status(500).json({ success: false, error: "Failed to load trending coins" });
  }
}
