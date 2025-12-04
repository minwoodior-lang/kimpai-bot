import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PremiumRow {
  symbol: string;
  exchange: string;
  market: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  volume24hKrw: number | null;
  volume24hUsdt: number | null;
  change24h: number | null;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string | null;
}

function guessCmcSlug(row: PremiumRow): string {
  // symbol에서 /KRW 제거 후 소문자로 변환
  const coin = row.symbol.split("/")[0].toLowerCase();
  // 한글명 우선 사용 가능하면 영문명 폴백
  const name = (row.name_en || row.symbol).toLowerCase().replace(/\s+/g, "-");
  return `${coin}-${name}`.replace(/--+/g, "-");
}

function loadPremium(): PremiumRow[] {
  const file = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const premium = loadPremium();

    const result = premium.map((row: PremiumRow) => ({
      exchange: row.exchange,
      market: row.market,
      symbol: row.symbol,
      name_ko: row.name_ko,
      name_en: row.name_en,
      icon_url: row.icon_url || `/coins/${row.symbol}.png`,
      koreanPrice: row.koreanPrice,
      globalPrice: row.globalPrice,
      globalPriceKrw: row.globalPriceKrw,
      premium: row.premium,
      isListed: true,
      displayName: row.name_ko || row.name_en || row.symbol,
      change24h: row.change24h ?? null,
      high24h: 0,
      low24h: 0,
      volume24hKrw: row.volume24hKrw ?? 0,
      volume24hUsdt: row.volume24hUsdt ?? null,
      volume24hForeignKrw: null,
      cmcSlug: guessCmcSlug(row),
    }));

    return res.status(200).json({
      success: true,
      data: result,
      averagePremium:
        result.length > 0
          ? result.reduce((sum: number, r: any) => sum + (r.premium || 0), 0) /
            result.length
          : 0,
      fxRate: 1350,
      updatedAt: new Date().toISOString(),
      totalMarkets: result.length,
    });
  } catch (err) {
    console.error("[API] /premium/table error:", err);
    return res.status(500).json({
      success: false,
      data: [],
      averagePremium: 0,
      fxRate: 0,
      updatedAt: new Date().toISOString(),
      totalMarkets: 0,
    });
  }
}
