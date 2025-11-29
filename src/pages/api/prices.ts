import type { NextApiRequest, NextApiResponse } from "next";

interface PriceData {
  symbol: string;
  koreanPrice: number;
  globalPrice: number;
  exchange: {
    korean: string;
    global: string;
  };
  timestamp: string;
}

interface PricesResponse {
  success: boolean;
  data: PriceData[];
  fxRate: number;
  updatedAt: string;
}

const mockPrices: PriceData[] = [
  {
    symbol: "BTC",
    koreanPrice: 98500000,
    globalPrice: 67500,
    exchange: { korean: "Upbit", global: "Binance" },
    timestamp: new Date().toISOString(),
  },
  {
    symbol: "ETH",
    koreanPrice: 4850000,
    globalPrice: 3320,
    exchange: { korean: "Upbit", global: "Binance" },
    timestamp: new Date().toISOString(),
  },
  {
    symbol: "XRP",
    koreanPrice: 850,
    globalPrice: 0.58,
    exchange: { korean: "Bithumb", global: "Binance" },
    timestamp: new Date().toISOString(),
  },
  {
    symbol: "SOL",
    koreanPrice: 285000,
    globalPrice: 195,
    exchange: { korean: "Upbit", global: "Coinbase" },
    timestamp: new Date().toISOString(),
  },
  {
    symbol: "ADA",
    koreanPrice: 720,
    globalPrice: 0.49,
    exchange: { korean: "Korbit", global: "Kraken" },
    timestamp: new Date().toISOString(),
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PricesResponse>
) {
  res.status(200).json({
    success: true,
    data: mockPrices,
    fxRate: 1325.5,
    updatedAt: new Date().toISOString(),
  });
}
