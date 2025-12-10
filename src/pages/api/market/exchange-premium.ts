import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PriceEntry {
  price: number;
  change24h?: number;
  volume24h?: number;
}

interface ExchangeSummary {
  exchange: string;
  avgPremium: number;
  maxPremium: { symbol: string; value: number };
  minPremium: { symbol: string; value: number };
  coinCount: number;
}

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

const DOMESTIC_EXCHANGES = ["UPBIT", "BITHUMB", "COINONE"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prices = loadPrices();
    const usdKrw = getUsdKrw();
    
    const exchangeData: Record<string, { symbol: string; premium: number }[]> = {
      UPBIT: [],
      BITHUMB: [],
      COINONE: [],
    };
    
    const symbols = new Set<string>();
    Object.keys(prices).forEach((key) => {
      const parts = key.split(":");
      if (parts.length === 3 && parts[2] === "KRW") {
        symbols.add(parts[1]);
      }
    });
    
    for (const symbol of symbols) {
      const binanceKey = `BINANCE:${symbol}:USDT`;
      const binancePrice = prices[binanceKey]?.price;
      if (!binancePrice) continue;
      
      for (const exchange of DOMESTIC_EXCHANGES) {
        const krwKey = `${exchange}:${symbol}:KRW`;
        const krwPrice = prices[krwKey]?.price;
        if (!krwPrice) continue;
        
        const globalPriceKrw = binancePrice * usdKrw;
        const premium = ((krwPrice - globalPriceKrw) / globalPriceKrw) * 100;
        
        if (Math.abs(premium) < 100) {
          exchangeData[exchange].push({ symbol, premium });
        }
      }
    }
    
    const summaries: ExchangeSummary[] = DOMESTIC_EXCHANGES.map((exchange) => {
      const coins = exchangeData[exchange];
      if (coins.length === 0) {
        return {
          exchange,
          avgPremium: 0,
          maxPremium: { symbol: "N/A", value: 0 },
          minPremium: { symbol: "N/A", value: 0 },
          coinCount: 0,
        };
      }
      
      const avgPremium = coins.reduce((sum, c) => sum + c.premium, 0) / coins.length;
      const sorted = [...coins].sort((a, b) => b.premium - a.premium);
      
      return {
        exchange,
        avgPremium: Math.round(avgPremium * 100) / 100,
        maxPremium: {
          symbol: sorted[0].symbol,
          value: Math.round(sorted[0].premium * 100) / 100,
        },
        minPremium: {
          symbol: sorted[sorted.length - 1].symbol,
          value: Math.round(sorted[sorted.length - 1].premium * 100) / 100,
        },
        coinCount: coins.length,
      };
    });
    
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    return res.status(200).json({
      success: true,
      data: summaries,
      usdKrw,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] /market/exchange-premium error:", err);
    return res.status(500).json({ success: false, error: "Failed to calculate exchange premiums" });
  }
}
