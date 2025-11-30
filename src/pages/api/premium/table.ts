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
  domesticExchange?: string;
  foreignExchange?: string;
}

interface PremiumTableResponse {
  success: boolean;
  data: PremiumTableRow[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
}

interface ExchangePriceRecord {
  id: number;
  exchange: string;
  symbol: string;
  base: string;
  quote: string;
  price: number;
  price_krw: number;
  volume_24h: number | null;
  change_24h: number | null;
  created_at: string;
}

const SYMBOL_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  XRP: "Ripple",
  SOL: "Solana",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
};

const SYMBOL_ORDER = ["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE", "AVAX"];

function parseExchangeParam(param: string): { exchange: string; quote: string } {
  const parts = param.split("_");
  if (parts.length === 2) {
    return { exchange: parts[0], quote: parts[1] };
  }
  return { exchange: param, quote: "USDT" };
}

async function fetchExchangePrices(exchange: string, quote: string): Promise<ExchangePriceRecord[]> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/exchange_prices?exchange=eq.${exchange}&quote=eq.${quote}&order=created_at.desc&limit=50`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch exchange prices:", await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching exchange prices:", error);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PremiumTableResponse>
) {
  try {
    const domesticParam = (req.query.domestic as string) || "UPBIT_KRW";
    const foreignParam = (req.query.foreign as string) || "BINANCE_USDT";

    const domestic = parseExchangeParam(domesticParam);
    const foreign = parseExchangeParam(foreignParam);

    const [domesticPrices, foreignPrices] = await Promise.all([
      fetchExchangePrices(domestic.exchange, domestic.quote),
      fetchExchangePrices(foreign.exchange, foreign.quote),
    ]);

    const domesticMap = new Map<string, ExchangePriceRecord>();
    const foreignMap = new Map<string, ExchangePriceRecord>();

    if (domesticPrices) {
      for (const record of domesticPrices) {
        if (!domesticMap.has(record.symbol)) {
          domesticMap.set(record.symbol, record);
        }
      }
    }

    if (foreignPrices) {
      for (const record of foreignPrices) {
        if (!foreignMap.has(record.symbol)) {
          foreignMap.set(record.symbol, record);
        }
      }
    }

    const tableData: PremiumTableRow[] = [];
    let fxRate = 1400;
    let latestTimestamp = "";

    for (const symbol of SYMBOL_ORDER) {
      const domesticRecord = domesticMap.get(symbol);
      const foreignRecord = foreignMap.get(symbol);

      if (domesticRecord && foreignRecord) {
        const domesticPriceKrw = Number(domesticRecord.price_krw);
        const foreignPriceKrw = Number(foreignRecord.price_krw);
        
        const premium = foreignPriceKrw > 0
          ? ((domesticPriceKrw - foreignPriceKrw) / foreignPriceKrw) * 100
          : 0;

        tableData.push({
          symbol,
          name: SYMBOL_NAMES[symbol] || symbol,
          koreanPrice: domesticPriceKrw,
          globalPrice: Number(foreignRecord.price),
          premium: Math.round(premium * 100) / 100,
          volume24h: Number(foreignRecord.volume_24h) || 0,
          change24h: Number(foreignRecord.change_24h) || 0,
          high24h: domesticPriceKrw * 1.01,
          low24h: domesticPriceKrw * 0.99,
          domesticExchange: domestic.exchange,
          foreignExchange: foreign.exchange,
        });

        if (!latestTimestamp || domesticRecord.created_at > latestTimestamp) {
          latestTimestamp = domesticRecord.created_at;
        }

        if (domestic.quote === "KRW" && foreign.quote === "USDT" && foreignRecord.price > 0) {
          fxRate = domesticPriceKrw / Number(foreignRecord.price) / (1 + premium / 100);
        }
      }
    }

    if (tableData.length === 0) {
      return await fallbackToSnapshots(req, res, domesticParam, foreignParam);
    }

    const averagePremium = tableData.length > 0
      ? tableData.reduce((acc, row) => acc + row.premium, 0) / tableData.length
      : 0;

    if (fxRate < 1000 || fxRate > 2000) {
      fxRate = 1400;
    }

    res.status(200).json({
      success: true,
      data: tableData,
      averagePremium: Math.round(averagePremium * 100) / 100,
      fxRate: Math.round(fxRate * 10) / 10,
      updatedAt: latestTimestamp || new Date().toISOString(),
      domesticExchange: domesticParam,
      foreignExchange: foreignParam,
    });
  } catch (error) {
    console.error("API error:", error);
    await fallbackToSnapshots(req, res, "UPBIT_KRW", "BINANCE_USDT");
  }
}

async function fallbackToSnapshots(
  req: NextApiRequest,
  res: NextApiResponse<PremiumTableResponse>,
  domesticParam: string,
  foreignParam: string
) {
  const { data: latestSnapshots, error } = await supabase
    .from("price_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !latestSnapshots || latestSnapshots.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      averagePremium: 0,
      fxRate: 1400,
      updatedAt: new Date().toISOString(),
      domesticExchange: domesticParam,
      foreignExchange: foreignParam,
    });
  }

  const latestBySymbol = new Map<string, any>();
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
      name: SYMBOL_NAMES[snapshot.symbol] || snapshot.name || snapshot.symbol,
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
    return SYMBOL_ORDER.indexOf(a.symbol) - SYMBOL_ORDER.indexOf(b.symbol);
  });

  const averagePremium = sortedData.reduce((acc, row) => acc + row.premium, 0) / sortedData.length;
  const latestSnapshot = latestSnapshots[0];
  const fxRate = Number(latestSnapshot?.fx_rate) || 1400;

  res.status(200).json({
    success: true,
    data: sortedData,
    averagePremium: Math.round(averagePremium * 100) / 100,
    fxRate,
    updatedAt: latestSnapshot?.created_at || new Date().toISOString(),
    domesticExchange: domesticParam,
    foreignExchange: foreignParam,
  });
}
