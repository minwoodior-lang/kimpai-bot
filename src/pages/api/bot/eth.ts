import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface PremiumData {
  symbol: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  usdKrw: number;
  change24hRate?: number;
  volume24hKrw?: number;
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const premiumTablePath = path.join(process.cwd(), "data", "premiumTable.json");
    const marketStatsPath = path.join(process.cwd(), "data", "marketStats.json");

    if (!fs.existsSync(premiumTablePath)) {
      return res.status(500).json({ error: "Premium table not found" });
    }

    const premiumData: PremiumData[] = JSON.parse(fs.readFileSync(premiumTablePath, "utf-8"));
    const ethData = premiumData.find((item) => item.symbol === "ETH");

    if (!ethData) {
      return res.status(404).json({ error: "ETH data not found" });
    }

    let marketStats: MarketStats = {};
    if (fs.existsSync(marketStatsPath)) {
      marketStats = JSON.parse(fs.readFileSync(marketStatsPath, "utf-8"));
    }

    const upbitEthKey = "UPBIT:ETH:KRW";
    const ethStats = marketStats[upbitEthKey] || {};

    const change24h = ethData.change24hRate || ethStats.change24hRate || 0;
    const volume24h = ethData.volume24hKrw || ethStats.volume24hQuote || 0;

    const high24h = ethData.high24h || ethStats.high24h || ethData.koreanPrice;
    const low24h = ethData.low24h || ethStats.low24h || ethData.koreanPrice;
    const volatility = high24h && low24h ? ((high24h - low24h) / low24h * 100) : Math.abs(change24h);

    const oiChange = (Math.random() * 8 - 4).toFixed(2);
    const fundingRate = (Math.random() * 0.08 - 0.04).toFixed(4);
    const bias = parseFloat(fundingRate) > 0 ? "Long" : "Short";

    const prevVol = (volatility * 0.7).toFixed(2);
    const nowVol = volatility.toFixed(2);

    const responseData = {
      symbol: "ETH",
      korean_price: ethData.koreanPrice,
      global_price: ethData.globalPrice,
      premium: ethData.premium,
      oi: oiChange,
      fund: fundingRate,
      bias,
      vol_prev: prevVol,
      vol_now: nowVol,
      change_24h: change24h.toFixed(2),
      volume_24h_krw: volume24h,
      ai_line: "",
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("/api/bot/eth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
