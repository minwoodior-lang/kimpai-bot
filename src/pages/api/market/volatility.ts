import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface MarketStats {
  change24hRate?: number;
  high24h?: number;
  low24h?: number;
  volume24hQuote?: number;
}

interface VolatilityData {
  index: number;
  level: "low" | "medium" | "high" | "extreme";
  description: string;
  avgChange24h: number;
  avgVolatility: number;
  topVolatile: { symbol: string; volatility: number }[];
  updatedAt: string;
}

function loadMarketStats(): Record<string, MarketStats> {
  const file = path.join(process.cwd(), "data/marketStats.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function calculateVolatility(high: number, low: number): number {
  if (low === 0) return 0;
  return ((high - low) / low) * 100;
}

function getVolatilityLevel(index: number): "low" | "medium" | "high" | "extreme" {
  if (index < 25) return "low";
  if (index < 50) return "medium";
  if (index < 75) return "high";
  return "extreme";
}

function getVolatilityDescription(level: string): string {
  switch (level) {
    case "low":
      return "시장이 안정적입니다. 횡보장 가능성이 높습니다.";
    case "medium":
      return "보통 수준의 변동성입니다. 일반적인 시장 상황입니다.";
    case "high":
      return "변동성이 높습니다. 리스크 관리에 주의하세요.";
    case "extreme":
      return "극단적인 변동성입니다. 포지션 관리를 철저히 하세요.";
    default:
      return "시장 상황을 분석 중입니다.";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const stats = loadMarketStats();
    
    const volatilities: { symbol: string; volatility: number; change: number }[] = [];
    
    Object.entries(stats).forEach(([key, stat]) => {
      const parts = key.split(":");
      if (parts.length !== 3) return;
      if (parts[0] !== "BINANCE" || parts[2] !== "USDT") return;
      
      const symbol = parts[1];
      const high = stat.high24h || 0;
      const low = stat.low24h || 0;
      const change = stat.change24hRate || 0;
      
      if (high > 0 && low > 0) {
        const volatility = calculateVolatility(high, low);
        volatilities.push({ symbol, volatility, change });
      }
    });
    
    if (volatilities.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          index: 50,
          level: "medium",
          description: "데이터 수집 중입니다.",
          avgChange24h: 0,
          avgVolatility: 0,
          topVolatile: [],
          updatedAt: new Date().toISOString(),
        },
      });
    }
    
    const avgVolatility = volatilities.reduce((sum, v) => sum + v.volatility, 0) / volatilities.length;
    const avgChange = volatilities.reduce((sum, v) => sum + Math.abs(v.change), 0) / volatilities.length;
    
    const index = Math.min(100, Math.round((avgVolatility * 5) + (avgChange * 3)));
    const level = getVolatilityLevel(index);
    
    const topVolatile = [...volatilities]
      .sort((a, b) => b.volatility - a.volatility)
      .slice(0, 5)
      .map((v) => ({
        symbol: v.symbol,
        volatility: Math.round(v.volatility * 100) / 100,
      }));
    
    const data: VolatilityData = {
      index,
      level,
      description: getVolatilityDescription(level),
      avgChange24h: Math.round(avgChange * 100) / 100,
      avgVolatility: Math.round(avgVolatility * 100) / 100,
      topVolatile,
      updatedAt: new Date().toISOString(),
    };
    
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[API] /market/volatility error:", err);
    return res.status(500).json({ success: false, error: "Failed to calculate volatility" });
  }
}
