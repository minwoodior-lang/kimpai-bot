import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { attachMetadata } from "@/utils/metadataMapper";

function loadPremium() {
  const file = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadMeta() {
  const file = path.join(process.cwd(), "data/master_symbols.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const premium = loadPremium();
    const meta = loadMeta();

    const result = premium
      .map((row: any) => {
        const mapped = attachMetadata(row, meta);
        return {
          symbol: mapped.symbol,
          name_ko: mapped.name_ko,
          name_en: mapped.name_en,
          icon_url: mapped.icon_url,
          koreanPrice: mapped.koreanPrice,
          globalPrice: mapped.globalPrice,
          globalPriceKrw: mapped.globalPriceKrw,
          premium: mapped.premium,
          domesticExchange: mapped.domesticExchange,
          foreignExchange: mapped.foreignExchange,
          // 컴포넌트 호환성 필드
          change24h: null,
          high24h: mapped.koreanPrice,
          low24h: mapped.koreanPrice,
          volume24hKrw: 0,
          volume24hForeignKrw: null,
          isListed: true,
          cmcSlug: undefined,
          koreanName: mapped.name_ko,
          displayName: mapped.name_ko || mapped.name_en || mapped.symbol,
        };
      })
      .filter((row: any) => row.koreanPrice !== null);

    return res.status(200).json({
      success: true,
      data: result,
      averagePremium: result.length > 0 
        ? result.reduce((sum: number, r: any) => sum + (r.premium || 0), 0) / result.length
        : 0,
      fxRate: 1350,
      updatedAt: new Date().toISOString(),
      totalCoins: result.length,
      listedCoins: result.filter((r: any) => r.isListed).length,
    });
  } catch (err) {
    console.error("[API] /premium/table error:", err);
    return res.status(500).json({
      success: false,
      data: [],
      averagePremium: 0,
      fxRate: 0,
      updatedAt: new Date().toISOString(),
      totalCoins: 0,
      listedCoins: 0,
    });
  }
}
