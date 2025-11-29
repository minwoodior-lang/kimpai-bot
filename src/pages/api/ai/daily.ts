import type { NextApiRequest, NextApiResponse } from "next";

interface TradingSignal {
  asset: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reason: string;
}

interface ArbitrageOpportunity {
  asset: string;
  fromExchange: string;
  toExchange: string;
  estimatedProfit: number;
  riskLevel: "low" | "medium" | "high";
}

interface DailyAnalysis {
  date: string;
  summary: string;
  marketSentiment: "bullish" | "bearish" | "neutral";
  averagePremium: number;
  premiumTrend: "increasing" | "decreasing" | "stable";
  prediction: {
    direction: string;
    confidence: number;
    timeframe: string;
  };
  tradingSignals: TradingSignal[];
  arbitrageOpportunities: ArbitrageOpportunity[];
  keyInsights: string[];
}

interface DailyResponse {
  success: boolean;
  data: DailyAnalysis;
  generatedAt: string;
}

const mockDailyAnalysis: DailyAnalysis = {
  date: new Date().toISOString().split("T")[0],
  summary:
    "The Kimchi Premium is currently at +3.8% average across major trading pairs. BTC premium has decreased by 0.5% in the last 24 hours, indicating reduced buying pressure in Korean markets. ETH shows stronger demand with a stable premium around 3.8%.",
  marketSentiment: "neutral",
  averagePremium: 3.8,
  premiumTrend: "stable",
  prediction: {
    direction: "Premium expected to stabilize with potential upward movement",
    confidence: 72,
    timeframe: "48 hours",
  },
  tradingSignals: [
    {
      asset: "BTC",
      signal: "HOLD",
      confidence: 65,
      reason: "Premium within normal range, wait for clearer direction",
    },
    {
      asset: "ETH",
      signal: "BUY",
      confidence: 72,
      reason: "Premium below 30-day average, potential undervaluation",
    },
    {
      asset: "XRP",
      signal: "SELL",
      confidence: 68,
      reason: "Premium spike above 5%, historical mean reversion expected",
    },
    {
      asset: "SOL",
      signal: "HOLD",
      confidence: 58,
      reason: "High volatility, insufficient signal clarity",
    },
  ],
  arbitrageOpportunities: [
    {
      asset: "BTC",
      fromExchange: "Upbit",
      toExchange: "Binance",
      estimatedProfit: 2.1,
      riskLevel: "medium",
    },
    {
      asset: "ETH",
      fromExchange: "Bithumb",
      toExchange: "Coinbase",
      estimatedProfit: 1.8,
      riskLevel: "low",
    },
  ],
  keyInsights: [
    "Korean retail interest remains strong despite global market uncertainty",
    "USD/KRW exchange rate stability supporting consistent premium levels",
    "Institutional flow from Korea showing increased ETH accumulation",
    "Weekend premiums typically 0.5-1% higher than weekday averages",
  ],
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DailyResponse>
) {
  res.status(200).json({
    success: true,
    data: mockDailyAnalysis,
    generatedAt: new Date().toISOString(),
  });
}
