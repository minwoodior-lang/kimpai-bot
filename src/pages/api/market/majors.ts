import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PriceEntry {
  price: number;
  change24h?: number;
  volume24h?: number;
}

interface MajorCoin {
  symbol: string;
  name: string;
  price: number;
  priceKrw: number;
  change24h: number;
  marketCap: number;
  marketCapChange: number;
  rank: number;
}

const MAJOR_COINS: { symbol: string; name: string; marketCap: number; rank: number }[] = [
  { symbol: "BTC", name: "Bitcoin", marketCap: 1900000000000, rank: 1 },
  { symbol: "ETH", name: "Ethereum", marketCap: 420000000000, rank: 2 },
  { symbol: "BNB", name: "BNB", marketCap: 85000000000, rank: 4 },
  { symbol: "SOL", name: "Solana", marketCap: 75000000000, rank: 5 },
  { symbol: "XRP", name: "XRP", marketCap: 65000000000, rank: 6 },
  { symbol: "DOGE", name: "Dogecoin", marketCap: 28000000000, rank: 8 },
  { symbol: "ADA", name: "Cardano", marketCap: 25000000000, rank: 9 },
  { symbol: "AVAX", name: "Avalanche", marketCap: 15000000000, rank: 12 },
  { symbol: "DOT", name: "Polkadot", marketCap: 10000000000, rank: 14 },
  { symbol: "LINK", name: "Chainlink", marketCap: 9000000000, rank: 15 },
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

function loadMarketStats(): Record<string, { change24hRate?: number }> {
  const file = path.join(process.cwd(), "data/marketStats.json");
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prices = loadPrices();
    const stats = loadMarketStats();
    const usdKrw = getUsdKrw();
    
    const majors: MajorCoin[] = MAJOR_COINS.map((coin) => {
      const priceKey = `BINANCE:${coin.symbol}:USDT`;
      const statsKey = `BINANCE:${coin.symbol}:USDT`;
      
      const price = prices[priceKey]?.price || 0;
      const change24h = stats[statsKey]?.change24hRate || 0;
      
      const marketCapChange = (change24h / 100) * coin.marketCap;
      
      return {
        symbol: coin.symbol,
        name: coin.name,
        price,
        priceKrw: price * usdKrw,
        change24h: Math.round(change24h * 100) / 100,
        marketCap: coin.marketCap,
        marketCapChange: Math.round(marketCapChange),
        rank: coin.rank,
      };
    });
    
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({
      success: true,
      data: majors,
      usdKrw,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] /market/majors error:", err);
    return res.status(500).json({ success: false, error: "Failed to load major coins" });
  }
}
