import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface PremiumData {
  symbol: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
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

    const binanceKey = `BINANCE:${upperSymbol}:USDT`;
    const stats = marketStats[binanceKey] || {};

    const volume24h = coinData.volume24hKrw || stats.volume24hQuote || 0;
    const change24h = coinData.change24hRate || stats.change24hRate || 0;
    const premium = coinData.premium;

    const volumeInCoin = volume24h / (coinData.koreanPrice || 1);
    const inflowRatio = change24h > 3 ? 0.25 : change24h > 0 ? 0.12 : change24h > -3 ? 0.05 : -0.08;
    const netInflow = Math.abs(volumeInCoin * inflowRatio).toFixed(0);
    
    const avgEntry = coinData.globalPrice.toFixed(2);
    
    const duration = Math.abs(change24h) > 8 ? "1시간 이내" : 
                     Math.abs(change24h) > 5 ? "1-2시간" : 
                     Math.abs(change24h) > 2 ? "2-4시간" : "4-6시간";
    
    const baseProb = 55;
    const changeBonus = Math.min(20, Math.abs(change24h) * 2);
    const kimpBonus = premium > 3 ? 5 : premium < 0 ? -5 : 0;
    const prob = Math.min(90, Math.max(50, Math.round(baseProb + changeBonus + kimpBonus)));
    
    const range = (Math.abs(change24h) * 1.1 + 1).toFixed(2);

    let trend: string;
    let aiLine: string;
    if (change24h > 5) {
      trend = "강한 매수세";
      aiLine = `${upperSymbol} ${trend} 포착. 24h +${change24h.toFixed(2)}% 상승, 김프 ${premium.toFixed(2)}% 유지 중. 추가 상승 가능성 존재.`;
    } else if (change24h > 2) {
      trend = "매수세 우위";
      aiLine = `${upperSymbol} ${trend} 감지. 24h ${change24h.toFixed(2)}% 변동, 현재 김프 ${premium.toFixed(2)}%. 추세 지속 여부 주시 필요.`;
    } else if (change24h > -2) {
      trend = "중립";
      aiLine = `${upperSymbol} 현재 ${trend} 상태. 가격 변동 ${change24h.toFixed(2)}%, 김프 ${premium.toFixed(2)}%. 방향성 탐색 중.`;
    } else if (change24h > -5) {
      trend = "매도세 증가";
      aiLine = `${upperSymbol} ${trend} 신호. 24h ${change24h.toFixed(2)}% 하락, 김프 ${premium.toFixed(2)}%. 추가 조정 가능성 주의.`;
    } else {
      trend = "강한 매도 압력";
      aiLine = `${upperSymbol} ${trend} 감지. 24h ${change24h.toFixed(2)}% 급락, 김프 ${premium.toFixed(2)}%. 신중한 접근 필요.`;
    }

    const data = {
      symbol: upperSymbol,
      net_inflow: netInflow,
      avg_entry: avgEntry,
      duration: duration,
      ai_line: aiLine,
      prob: prob,
      range: range,
      trend: trend,
      korean_price: coinData.koreanPrice,
      global_price: coinData.globalPrice,
      premium: premium.toFixed(2),
      change_24h: change24h.toFixed(2),
      volume_24h_krw: volume24h,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/pro/whale/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
