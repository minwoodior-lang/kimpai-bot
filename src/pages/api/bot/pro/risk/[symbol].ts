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
    fundingRate?: number;
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
    const binanceFuturesKey = `BINANCE_FUTURES:${upperSymbol}:USDT`;
    const stats = marketStats[binanceKey] || {};
    const futuresStats = marketStats[binanceFuturesKey] || {};

    const change24h = coinData.change24hRate || stats.change24hRate || 0;
    const volume24h = coinData.volume24hKrw || stats.volume24hQuote || 0;
    const premium = coinData.premium;
    
    const fundingRate = futuresStats.fundingRate || (change24h > 5 ? 0.01 : change24h < -5 ? -0.01 : 0.0001 * change24h);

    let patternName: string;
    let plDesc: string;
    let riskLevel: string;

    if (change24h > 15) {
      patternName = "급등 과열 (Extreme Overbought)";
      plDesc = "급등 후 급락 가능성 매우 높음";
      riskLevel = "매우 높음";
    } else if (change24h > 10) {
      patternName = "과매수 (Overbought)";
      plDesc = "급등 후 차익실현 예상";
      riskLevel = "높음";
    } else if (change24h > 5) {
      patternName = "상승 추세";
      plDesc = "수익 실현 구간 진입";
      riskLevel = "중간";
    } else if (change24h > 2) {
      patternName = "완만한 상승";
      plDesc = "추세 지속 가능";
      riskLevel = "낮음";
    } else if (change24h > -2) {
      patternName = "박스권";
      plDesc = "횡보 중, 방향성 탐색";
      riskLevel = "낮음";
    } else if (change24h > -5) {
      patternName = "완만한 하락";
      plDesc = "조정 진행 중";
      riskLevel = "낮음";
    } else if (change24h > -10) {
      patternName = "하락 추세";
      plDesc = "추가 하락 주의";
      riskLevel = "중간";
    } else if (change24h > -15) {
      patternName = "과매도 (Oversold)";
      plDesc = "반등 가능성 존재";
      riskLevel = "높음";
    } else {
      patternName = "급락 패닉 (Extreme Oversold)";
      plDesc = "급락 후 기술적 반등 가능";
      riskLevel = "매우 높음";
    }

    const baseProb = 50;
    const changeBonus = Math.min(25, Math.abs(change24h) * 1.5);
    const kimpBonus = Math.abs(premium) > 5 ? 10 : Math.abs(premium) > 3 ? 5 : 0;
    const prob = Math.min(95, Math.max(40, Math.round(baseProb + changeBonus + kimpBonus)));
    
    const minChange = (-Math.abs(change24h) * 0.6 - 1).toFixed(2);
    const maxChange = (-Math.abs(change24h) * 0.2).toFixed(2);

    let entry: string;
    let manage: string;

    if (riskLevel === "매우 높음") {
      entry = "신규 진입 금지";
      manage = "기존 포지션 즉시 점검 필요";
    } else if (riskLevel === "높음") {
      entry = "신규 진입 비권장";
      manage = "기존 포지션 축소 권장";
    } else if (riskLevel === "중간") {
      entry = "소량 분할 매수 고려";
      manage = "손절가 설정 필수";
    } else {
      entry = "관망 또는 분할 진입 가능";
      manage = "현 포지션 유지 가능";
    }

    const data = {
      symbol: upperSymbol,
      vol: change24h.toFixed(2),
      fund: (fundingRate * 100).toFixed(4),
      pl_desc: plDesc,
      pattern_name: patternName,
      prob: prob,
      min: minChange,
      max: maxChange,
      entry: entry,
      manage: manage,
      risk_level: riskLevel,
      korean_price: coinData.koreanPrice,
      global_price: coinData.globalPrice,
      premium: premium.toFixed(2),
      change_24h: change24h.toFixed(2),
      volume_24h_krw: volume24h,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/pro/risk/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
