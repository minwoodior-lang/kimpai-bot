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
}

interface MarketStats {
  [key: string]: {
    change24hRate?: number;
    volume24hQuote?: number;
    openInterest?: number;
    fundingRate?: number;
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
    const btcData = premiumData.find((item) => item.symbol === "BTC");

    if (!btcData) {
      return res.status(404).json({ error: "BTC data not found" });
    }

    let marketStats: MarketStats = {};
    if (fs.existsSync(marketStatsPath)) {
      marketStats = JSON.parse(fs.readFileSync(marketStatsPath, "utf-8"));
    }

    const binanceKey = "BINANCE:BTC:USDT";
    const binanceFuturesKey = "BINANCE_FUTURES:BTC:USDT";
    const stats = marketStats[binanceKey] || {};
    const futuresStats = marketStats[binanceFuturesKey] || {};

    const currentKimp = btcData.premium;
    const koreanPrice = btcData.koreanPrice;
    const globalPrice = btcData.globalPrice;
    const usdKrw = btcData.usdKrw;
    const change24h = btcData.change24hRate || stats.change24hRate || 0;
    const volume24h = btcData.volume24hKrw || 0;

    const kimpScore = Math.min(10, Math.max(1, Math.round(5 + (currentKimp - 2) * 2)));
    const changeScore = Math.min(3, Math.max(-3, Math.round(change24h / 2)));
    const score = Math.min(10, Math.max(1, kimpScore + changeScore));
    
    const lsRatio = change24h > 2 ? "7:3" : change24h > 0 ? "6:4" : change24h > -2 ? "5:5" : "4:6";
    
    const upProb = Math.min(85, Math.max(25, Math.round(50 + change24h * 2.5 + (currentKimp > 3 ? 5 : currentKimp < 1 ? -5 : 0))));
    
    const volatility = Math.abs(change24h);
    const minChange = (-volatility * 0.8 - 1.5).toFixed(2);
    const maxChange = (volatility * 0.6 + 2.0).toFixed(2);

    const dp1 = Math.round(koreanPrice * 0.97);
    const dp2 = Math.round(koreanPrice * 0.94);
    const tp1 = Math.round(koreanPrice * 1.03);
    const tp2 = Math.round(koreanPrice * 1.06);

    const data = {
      kimp: currentKimp.toFixed(2),
      score: score,
      ls_ratio: lsRatio,
      up_prob: upProb,
      min: minChange,
      max: maxChange,
      korean_price: koreanPrice,
      global_price: globalPrice,
      usd_krw: usdKrw,
      change_24h: change24h.toFixed(2),
      volume_24h_krw: volume24h,
      dp1: dp1.toLocaleString(),
      dp2: dp2.toLocaleString(),
      tp1: tp1.toLocaleString(),
      tp2: tp2.toLocaleString(),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("/api/bot/pro/btc error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
