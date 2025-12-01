import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PremiumTableRow {
  symbol: string;
  name: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  volume24hKrw: number;
  volume24hUsdt: number;
  volume24hForeignKrw: number;
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
    return { exchange: parts[0].toLowerCase(), quote: parts[1].toUpperCase() };
  }
  return { exchange: param.toLowerCase(), quote: "USDT" };
}

async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.KRW || 1400;
  } catch {
    return 1400;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PremiumTableResponse | { error: string; retryAfter?: number }>
) {
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    res.setHeader("Retry-After", String(rateCheck.retryAfter || 2));
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: rateCheck.retryAfter,
    } as { error: string; retryAfter?: number });
  }

  try {
    const domesticParam = (req.query.domestic as string) || "UPBIT_KRW";
    const foreignParam = (req.query.foreign as string) || "BINANCE_USDT";

    const domestic = parseExchangeParam(domesticParam);
    const foreign = parseExchangeParam(foreignParam);

    const fxRate = await fetchExchangeRate();

    const { data: allPrices, error } = await supabase
      .from("exchange_prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Database error:", error.message);
      return res.status(200).json({
        success: true,
        data: [],
        averagePremium: 0,
        fxRate,
        updatedAt: new Date().toISOString(),
        domesticExchange: domesticParam,
        foreignExchange: foreignParam,
      });
    }

    const domesticMap = new Map<string, ExchangePriceRecord>();
    const foreignMap = new Map<string, ExchangePriceRecord>();
    const fallbackForeignMap = new Map<string, ExchangePriceRecord>();
    const krwPriceMap = new Map<string, ExchangePriceRecord>();

    for (const record of allPrices || []) {
      const recordExchange = record.exchange.toLowerCase();
      const recordQuote = record.quote.toUpperCase();
      
      if (recordExchange === domestic.exchange && recordQuote === domestic.quote) {
        if (!domesticMap.has(record.symbol)) {
          domesticMap.set(record.symbol, record);
        }
      }
      
      if (recordExchange === foreign.exchange && recordQuote === foreign.quote) {
        if (!foreignMap.has(record.symbol)) {
          foreignMap.set(record.symbol, record);
        }
      }
      
      if (recordQuote === "USDT" && !fallbackForeignMap.has(record.symbol)) {
        fallbackForeignMap.set(record.symbol, record);
      }
      
      if (recordQuote === "KRW" && !krwPriceMap.has(record.symbol)) {
        krwPriceMap.set(record.symbol, record);
      }
    }

    const btcKrwRecord = krwPriceMap.get("BTC");
    const btcKrwPrice = btcKrwRecord ? Number(btcKrwRecord.price) : 0;
    const btcUsdtRecord = fallbackForeignMap.get("BTC");
    const btcUsdtPrice = btcUsdtRecord ? Number(btcUsdtRecord.price) : 0;

    const tableData: PremiumTableRow[] = [];
    let latestTimestamp = "";

    for (const symbol of SYMBOL_ORDER) {
      let domesticRecord = domesticMap.get(symbol);
      let foreignRecord = foreignMap.get(symbol);
      
      if (!foreignRecord && fallbackForeignMap.has(symbol)) {
        foreignRecord = fallbackForeignMap.get(symbol);
      }

      if (symbol === "BTC" && domestic.quote === "BTC" && !domesticRecord) {
        domesticRecord = krwPriceMap.get("BTC");
      }
      if (symbol === "BTC" && foreign.quote === "BTC" && !foreignRecord) {
        foreignRecord = fallbackForeignMap.get("BTC");
      }

      if (domesticRecord && foreignRecord) {
        let domesticPriceKrw = Number(domesticRecord.price);
        let foreignPriceKrw = Number(foreignRecord.price);
        let globalPriceUsd = Number(foreignRecord.price);
        
        if (domestic.quote === "KRW") {
          domesticPriceKrw = Number(domesticRecord.price);
        } else if (domestic.quote === "USDT") {
          domesticPriceKrw = Number(domesticRecord.price) * fxRate;
        } else if (domestic.quote === "BTC") {
          if (symbol === "BTC") {
            domesticPriceKrw = btcKrwPrice > 0 ? btcKrwPrice : btcUsdtPrice * fxRate;
          } else if (btcKrwPrice > 0) {
            domesticPriceKrw = Number(domesticRecord.price) * btcKrwPrice;
          } else if (btcUsdtPrice > 0) {
            domesticPriceKrw = Number(domesticRecord.price) * btcUsdtPrice * fxRate;
          }
        }
        
        if (foreignRecord.quote.toUpperCase() === "KRW") {
          foreignPriceKrw = Number(foreignRecord.price);
          globalPriceUsd = Number(foreignRecord.price) / fxRate;
        } else if (foreignRecord.quote.toUpperCase() === "USDT") {
          foreignPriceKrw = Number(foreignRecord.price) * fxRate;
          globalPriceUsd = Number(foreignRecord.price);
        } else if (foreignRecord.quote.toUpperCase() === "BTC") {
          if (symbol === "BTC") {
            globalPriceUsd = btcUsdtPrice;
            foreignPriceKrw = btcUsdtPrice * fxRate;
          } else if (btcUsdtPrice > 0) {
            globalPriceUsd = Number(foreignRecord.price) * btcUsdtPrice;
            foreignPriceKrw = globalPriceUsd * fxRate;
          } else if (btcKrwPrice > 0) {
            foreignPriceKrw = Number(foreignRecord.price) * btcKrwPrice;
            globalPriceUsd = foreignPriceKrw / fxRate;
          }
        }
        
        const premium = foreignPriceKrw > 0
          ? ((domesticPriceKrw - foreignPriceKrw) / foreignPriceKrw) * 100
          : 0;

        const domesticVolumeKrw = Number(domesticRecord.volume_24h) || 0;
        
        const foreignVolumeRaw = Number(foreignRecord.volume_24h) || 0;
        let foreignVolumeUsdt = foreignVolumeRaw;
        if (foreignRecord.quote.toUpperCase() === "KRW") {
          foreignVolumeUsdt = foreignVolumeRaw / fxRate;
        }
        
        const foreignVolumeKrw = foreignVolumeUsdt * fxRate;
        
        tableData.push({
          symbol,
          name: SYMBOL_NAMES[symbol] || symbol,
          koreanPrice: Math.round(domesticPriceKrw),
          globalPrice: globalPriceUsd,
          premium: Math.round(premium * 100) / 100,
          volume24hKrw: Math.round(domesticVolumeKrw),
          volume24hUsdt: foreignVolumeUsdt,
          volume24hForeignKrw: Math.round(foreignVolumeKrw),
          change24h: Math.round((Number(foreignRecord.change_24h) || 0) * 100) / 100,
          high24h: Math.round(domesticPriceKrw * 1.01),
          low24h: Math.round(domesticPriceKrw * 0.99),
          domesticExchange: domestic.exchange.toUpperCase(),
          foreignExchange: foreignRecord.exchange.toUpperCase(),
        });

        if (!latestTimestamp || domesticRecord.created_at > latestTimestamp) {
          latestTimestamp = domesticRecord.created_at;
        }
      }
    }

    const averagePremium = tableData.length > 0
      ? tableData.reduce((acc, row) => acc + row.premium, 0) / tableData.length
      : 0;

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
    res.status(200).json({
      success: true,
      data: [],
      averagePremium: 0,
      fxRate: 1400,
      updatedAt: new Date().toISOString(),
      domesticExchange: "UPBIT_KRW",
      foreignExchange: "BINANCE_USDT",
    });
  }
}
