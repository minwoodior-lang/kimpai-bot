import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PremiumRow {
  symbol: string;
  premium: number | null;
  koreanPrice: number | null;
  globalPrice: number | null;
  change24hRate: number | null;
  volume24hKrw: number | null;
  usdKrw: number;
}

interface MarketSummary {
  avgPremium: number;
  minPremium: { value: number; symbol: string };
  maxPremium: { value: number; symbol: string };
  btcDominance: number;
  btcDominanceChange: number;
  globalVolumeUsd: number;
  globalVolumeChange24h: number;
  domesticVolumeKrw: number;
  usdKrw: number;
  usdtPremium: number;
  topGainers: { symbol: string; change: number }[];
  topLosers: { symbol: string; change: number }[];
  updatedAt: string;
}

function loadPremiumTable(): PremiumRow[] {
  const file = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const premiumData = loadPremiumTable();
    
    const validPremiums = premiumData.filter(
      (r) => r.premium !== null && r.premium !== undefined && Math.abs(r.premium) < 100
    );
    
    const avgPremium = validPremiums.length > 0
      ? validPremiums.reduce((sum, r) => sum + (r.premium || 0), 0) / validPremiums.length
      : 0;
    
    const sortedByPremium = [...validPremiums].sort((a, b) => (b.premium || 0) - (a.premium || 0));
    const maxPremium = sortedByPremium[0] || { symbol: "N/A", premium: 0 };
    const minPremium = sortedByPremium[sortedByPremium.length - 1] || { symbol: "N/A", premium: 0 };
    
    const domesticVolumeKrw = premiumData.reduce((sum, r) => sum + (r.volume24hKrw || 0), 0);
    
    const usdKrw = premiumData[0]?.usdKrw || 1380;
    
    const validChanges = premiumData.filter(
      (r) => r.change24hRate !== null && r.change24hRate !== undefined
    );
    const sortedByChange = [...validChanges].sort((a, b) => (b.change24hRate || 0) - (a.change24hRate || 0));
    
    const topGainers = sortedByChange.slice(0, 3).map((r) => ({
      symbol: r.symbol,
      change: r.change24hRate || 0,
    }));
    
    const topLosers = sortedByChange.slice(-3).reverse().map((r) => ({
      symbol: r.symbol,
      change: r.change24hRate || 0,
    }));

    const btcRow = premiumData.find((r) => r.symbol === "BTC");
    const usdtPremium = btcRow ? (btcRow.premium || 0) * 0.1 : 0;

    const summary: MarketSummary = {
      avgPremium: Math.round(avgPremium * 100) / 100,
      minPremium: { value: minPremium.premium || 0, symbol: minPremium.symbol },
      maxPremium: { value: maxPremium.premium || 0, symbol: maxPremium.symbol },
      btcDominance: 58.2,
      btcDominanceChange: 0.3,
      globalVolumeUsd: 85000000000,
      globalVolumeChange24h: 2.5,
      domesticVolumeKrw,
      usdKrw,
      usdtPremium: Math.round(usdtPremium * 100) / 100,
      topGainers,
      topLosers,
      updatedAt: new Date().toISOString(),
    };

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    return res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error("[API] /market/summary error:", err);
    return res.status(500).json({ success: false, error: "Failed to load market summary" });
  }
}
