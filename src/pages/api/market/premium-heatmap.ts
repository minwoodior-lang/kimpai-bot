import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PriceEntry {
  price: number;
  change24h?: number;
  volume24h?: number;
}

interface HeatmapRow {
  symbol: string;
  name_ko?: string;
  UPBIT_KRW: number | null;
  BITHUMB_KRW: number | null;
  COINONE_KRW: number | null;
  BINANCE_USDT: number | null;
  OKX_USDT: number | null;
  BYBIT_USDT: number | null;
}

const EXCHANGES = {
  domestic: ["UPBIT_KRW", "BITHUMB_KRW", "COINONE_KRW"],
  global: ["BINANCE_USDT", "OKX_USDT", "BYBIT_USDT"],
};

const TOP_SYMBOLS = [
  "BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC",
  "SUI", "APT", "NEAR", "OP", "ARB", "PEPE", "SHIB", "TRX", "ATOM", "FIL"
];

function loadPrices(): Record<string, PriceEntry> {
  const file = path.join(process.cwd(), "data/prices.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function getUsdKrw(): number {
  const premiumFile = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(premiumFile)) return 1380;
  try {
    const data = JSON.parse(fs.readFileSync(premiumFile, "utf8"));
    return data[0]?.usdKrw || 1380;
  } catch {
    return 1380;
  }
}

function calculatePremium(
  koreanPrice: number | null,
  globalPrice: number | null,
  usdKrw: number
): number | null {
  if (!koreanPrice || !globalPrice || globalPrice === 0) return null;
  const globalPriceKrw = globalPrice * usdKrw;
  return ((koreanPrice - globalPriceKrw) / globalPriceKrw) * 100;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prices = loadPrices();
    const usdKrw = getUsdKrw();
    
    const heatmap: HeatmapRow[] = [];
    
    for (const symbol of TOP_SYMBOLS) {
      const binanceKey = `BINANCE:${symbol}:USDT`;
      const binancePrice = prices[binanceKey]?.price || null;
      
      const row: HeatmapRow = {
        symbol,
        UPBIT_KRW: null,
        BITHUMB_KRW: null,
        COINONE_KRW: null,
        BINANCE_USDT: 0,
        OKX_USDT: null,
        BYBIT_USDT: null,
      };
      
      const upbitKey = `UPBIT:${symbol}:KRW`;
      const upbitPrice = prices[upbitKey]?.price || null;
      row.UPBIT_KRW = calculatePremium(upbitPrice, binancePrice, usdKrw);
      
      const bithumbKey = `BITHUMB:${symbol}:KRW`;
      const bithumbPrice = prices[bithumbKey]?.price || null;
      row.BITHUMB_KRW = calculatePremium(bithumbPrice, binancePrice, usdKrw);
      
      const coinoneKey = `COINONE:${symbol}:KRW`;
      const coinonePrice = prices[coinoneKey]?.price || null;
      row.COINONE_KRW = calculatePremium(coinonePrice, binancePrice, usdKrw);
      
      const okxKey = `OKX:${symbol}:USDT`;
      const okxPrice = prices[okxKey]?.price || null;
      if (binancePrice && okxPrice) {
        row.OKX_USDT = ((okxPrice - binancePrice) / binancePrice) * 100;
      }
      
      const bybitKey = `BYBIT:${symbol}:USDT`;
      const bybitPrice = prices[bybitKey]?.price || null;
      if (binancePrice && bybitPrice) {
        row.BYBIT_USDT = ((bybitPrice - binancePrice) / binancePrice) * 100;
      }
      
      heatmap.push(row);
    }
    
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    return res.status(200).json({
      success: true,
      data: heatmap,
      exchanges: EXCHANGES,
      usdKrw,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] /market/premium-heatmap error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate heatmap" });
  }
}
