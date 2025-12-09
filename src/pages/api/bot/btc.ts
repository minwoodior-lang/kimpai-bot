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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const premiumTablePath = path.join(process.cwd(), "data", "premiumTable.json");
    
    if (!fs.existsSync(premiumTablePath)) {
      return res.status(500).json({ error: "Premium table not found" });
    }

    const premiumData: PremiumData[] = JSON.parse(fs.readFileSync(premiumTablePath, "utf-8"));
    const btcData = premiumData.find((item) => item.symbol === "BTC");

    if (!btcData) {
      return res.status(404).json({ error: "BTC data not found" });
    }

    const currentKimp = btcData.premium;
    const change24h = btcData.change24hRate || 0;
    const koreanPrice = btcData.koreanPrice;
    const globalPrice = btcData.globalPrice;
    const usdKrw = btcData.usdKrw;

    const prevKimp = currentKimp - (change24h * 0.1);

    let trend = "비슷";
    if (currentKimp > 1) {
      trend = "높음";
    } else if (currentKimp < -1) {
      trend = "낮음";
    }

    const prob = Math.min(85, Math.max(60, 70 + Math.abs(currentKimp) * 2));
    const futureMove = Math.abs(currentKimp * 0.5).toFixed(2);

    const responseData = {
      prev: prevKimp.toFixed(2),
      current: currentKimp.toFixed(2),
      trend,
      korean_price: koreanPrice,
      global_price: globalPrice,
      usd_krw: usdKrw,
      change_24h: change24h.toFixed(2),
      ai_line: "",
      prob: Math.round(prob),
      future_move: futureMove,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("/api/bot/btc error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
