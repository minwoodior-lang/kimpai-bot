import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PremiumTableRow {
  symbol: string;
  name: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

interface PremiumTableResponse {
  success: boolean;
  data: PremiumTableRow[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
}

interface PriceSnapshot {
  id: number;
  symbol: string;
  name: string;
  upbit_price: number;
  binance_price_usd: number;
  fx_rate: number;
  premium: number;
  volume_24h: number | null;
  change_24h: number | null;
  created_at: string;
}

const mockPremiumTable: PremiumTableRow[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    koreanPrice: 98500000,
    globalPrice: 67500,
    premium: 4.2,
    volume24h: 1250000000,
    change24h: 2.1,
    high24h: 99200000,
    low24h: 96800000,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    koreanPrice: 4850000,
    globalPrice: 3320,
    premium: 3.8,
    volume24h: 680000000,
    change24h: 1.5,
    high24h: 4920000,
    low24h: 4780000,
  },
  {
    symbol: "XRP",
    name: "Ripple",
    koreanPrice: 850,
    globalPrice: 0.58,
    premium: 5.1,
    volume24h: 420000000,
    change24h: -0.8,
    high24h: 880,
    low24h: 820,
  },
  {
    symbol: "SOL",
    name: "Solana",
    koreanPrice: 285000,
    globalPrice: 195,
    premium: 3.2,
    volume24h: 320000000,
    change24h: 3.2,
    high24h: 292000,
    low24h: 278000,
  },
  {
    symbol: "ADA",
    name: "Cardano",
    koreanPrice: 720,
    globalPrice: 0.49,
    premium: 4.5,
    volume24h: 180000000,
    change24h: 0.5,
    high24h: 745,
    low24h: 705,
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    koreanPrice: 185,
    globalPrice: 0.126,
    premium: 4.8,
    volume24h: 150000000,
    change24h: 1.2,
    high24h: 192,
    low24h: 180,
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    koreanPrice: 52000,
    globalPrice: 35.5,
    premium: 3.6,
    volume24h: 95000000,
    change24h: -1.1,
    high24h: 54500,
    low24h: 51200,
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PremiumTableResponse>
) {
  try {
    const { data: latestSnapshots, error } = await supabase
      .from("price_snapshots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !latestSnapshots || latestSnapshots.length === 0) {
      console.warn("No snapshots found, using mock data:", error?.message);
      const averagePremium = mockPremiumTable.reduce((acc, row) => acc + row.premium, 0) / mockPremiumTable.length;
      return res.status(200).json({
        success: true,
        data: mockPremiumTable,
        averagePremium: Math.round(averagePremium * 100) / 100,
        fxRate: 1325.5,
        updatedAt: new Date().toISOString(),
      });
    }

    const latestBySymbol = new Map<string, PriceSnapshot>();
    for (const snapshot of latestSnapshots) {
      if (!latestBySymbol.has(snapshot.symbol)) {
        latestBySymbol.set(snapshot.symbol, snapshot);
      }
    }

    const tableData: PremiumTableRow[] = Array.from(latestBySymbol.values()).map((snapshot) => {
      const koreanPrice = Number(snapshot.upbit_price);
      const globalPrice = Number(snapshot.binance_price_usd);
      const premium = Number(snapshot.premium);
      const volume24h = Number(snapshot.volume_24h) || 0;
      const change24h = Number(snapshot.change_24h) || 0;
      
      return {
        symbol: snapshot.symbol,
        name: snapshot.name || snapshot.symbol,
        koreanPrice,
        globalPrice,
        premium,
        volume24h,
        change24h,
        high24h: koreanPrice * 1.01,
        low24h: koreanPrice * 0.99,
      };
    });

    const sortedData = tableData.sort((a, b) => {
      const order = ["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE", "AVAX"];
      return order.indexOf(a.symbol) - order.indexOf(b.symbol);
    });

    const averagePremium = sortedData.reduce((acc, row) => acc + row.premium, 0) / sortedData.length;
    const latestSnapshot = latestSnapshots[0];
    const fxRate = Number(latestSnapshot?.fx_rate) || 1350;

    res.status(200).json({
      success: true,
      data: sortedData,
      averagePremium: Math.round(averagePremium * 100) / 100,
      fxRate,
      updatedAt: latestSnapshot?.created_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("API error:", error);
    const averagePremium = mockPremiumTable.reduce((acc, row) => acc + row.premium, 0) / mockPremiumTable.length;
    res.status(200).json({
      success: true,
      data: mockPremiumTable,
      averagePremium: Math.round(averagePremium * 100) / 100,
      fxRate: 1325.5,
      updatedAt: new Date().toISOString(),
    });
  }
}
