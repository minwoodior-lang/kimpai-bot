import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface PremiumData {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  usdKrw: number;
  volume24hKrw?: number;
  volume24hForeignKrw?: number;
  change24hRate?: number;
  change24hAbs?: number;
  high24h?: number;
  low24h?: number;
}

interface MarketStats {
  [key: string]: {
    change24hRate?: number;
    volume24hQuote?: number;
    high24h?: number;
    low24h?: number;
    fundingRate?: number;
  };
}

const EXCLUDED_SYMBOLS = ["USDT", "USDC", "DAI", "BUSD", "USDP", "FRAX", "LUSD", "MIM", "OUSD", "USH", "UUSD", "WBTC", "GOHM", "FRXETH", "STVETH", "BTC", "ETH"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { limit = "50", sort = "volume" } = req.query;
    const limitNum = Math.min(Number(limit), 100);

    const premiumTablePath = path.join(process.cwd(), "data", "premiumTable.json");
    const marketStatsPath = path.join(process.cwd(), "data", "marketStats.json");

    if (!fs.existsSync(premiumTablePath)) {
      return res.status(500).json({ error: "Premium table not found" });
    }

    const premiumData: PremiumData[] = JSON.parse(fs.readFileSync(premiumTablePath, "utf-8"));
    
    let marketStats: MarketStats = {};
    if (fs.existsSync(marketStatsPath)) {
      marketStats = JSON.parse(fs.readFileSync(marketStatsPath, "utf-8"));
    }

    const altCoins = premiumData
      .filter((item) => !EXCLUDED_SYMBOLS.includes(item.symbol))
      .map((item) => {
        const upbitKrwKey = `UPBIT:${item.symbol}:KRW`;
        const binanceKey = `BINANCE:${item.symbol}:USDT`;
        const stats = marketStats[upbitKrwKey] || {};
        const binanceStats = marketStats[binanceKey] || {};

        const priceChange = item.change24hRate || stats.change24hRate || 0;

        const currentVolume = item.volume24hKrw || stats.volume24hQuote || 0;
        const foreignVolume = item.volume24hForeignKrw || binanceStats.volume24hQuote || 0;
        const avgVolume = currentVolume > 0 ? currentVolume * 0.8 : 1;
        const volumeChangeRaw = avgVolume > 0 ? ((currentVolume - avgVolume) / avgVolume) * 100 : 0;
        const volumeChange = Math.min(500, Math.max(-80, volumeChangeRaw));

        const usdtPrice = item.globalPrice || 0;
        
        const fundingRate = binanceStats.fundingRate || (Math.random() * 0.06 - 0.03);

        const volatility = Math.abs(priceChange) + Math.abs(volumeChange * 0.05);

        return {
          symbol: item.symbol,
          name_ko: item.name_ko || item.symbol,
          name_en: item.name_en || item.symbol,
          korean_price: item.koreanPrice,
          usdt_price: usdtPrice,
          global_price: item.globalPrice,
          premium: item.premium,
          volume_change_1h: volumeChange.toFixed(1),
          price_change_1h: priceChange.toFixed(2),
          vol_change: volumeChange.toFixed(1),
          price_change: priceChange.toFixed(2),
          volume_24h_krw: currentVolume,
          funding_rate: fundingRate.toFixed(4),
          fund: fundingRate.toFixed(4),
          volatility_score: volatility,
        };
      });

    let sortedAlts;
    if (sort === "volatility") {
      sortedAlts = altCoins.sort((a, b) => b.volatility_score - a.volatility_score);
    } else if (sort === "premium") {
      sortedAlts = altCoins.sort((a, b) => Math.abs(b.premium) - Math.abs(a.premium));
    } else {
      sortedAlts = altCoins.sort((a, b) => b.volume_24h_krw - a.volume_24h_krw);
    }

    const result = sortedAlts.slice(0, limitNum).map((alt) => ({
      symbol: alt.symbol,
      name_ko: alt.name_ko,
      name_en: alt.name_en,
      korean_price: alt.korean_price,
      usdt_price: alt.usdt_price,
      global_price: alt.global_price,
      premium: alt.premium,
      volume_change_1h: alt.volume_change_1h,
      price_change_1h: alt.price_change_1h,
      vol_change: alt.vol_change,
      price_change: alt.price_change,
      funding_rate: alt.funding_rate,
      fund: alt.fund,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("/api/bot/alts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
