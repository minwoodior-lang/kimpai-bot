import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

interface PremiumRow {
  symbol: string;
  koreanPrice: number | null;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  domesticExchange: string | null;
  foreignExchange: string | null;
}

interface MasterSymbol {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string;
}

function loadPremium(): PremiumRow[] {
  const file = path.join(process.cwd(), "data/premiumTable.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadMaster(): Record<string, MasterSymbol> {
  const file = path.join(process.cwd(), "data/master_symbols.json");
  if (!fs.existsSync(file)) return {};

  const data: MasterSymbol[] = JSON.parse(fs.readFileSync(file, "utf8"));
  const map: Record<string, MasterSymbol> = {};
  for (const m of data) {
    map[m.base_symbol] = m;
  }
  return map;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const premium = loadPremium();
    const masterMap = loadMaster();

    const result = premium
      .map((row: PremiumRow) => {
        try {
          const master = masterMap[row.symbol];
          return {
            symbol: row.symbol,
            name_ko: master?.name_ko || null,
            name_en: master?.name_en || null,
            icon_url: master?.icon_url || `/coins/${row.symbol}.png`,
            koreanPrice: row.koreanPrice,
            globalPrice: row.globalPrice,
            globalPriceKrw: row.globalPriceKrw,
            premium: row.premium,
            domesticExchange: row.domesticExchange,
            foreignExchange: row.foreignExchange,
            change24h: null,
            high24h: row.koreanPrice || 0,
            low24h: row.koreanPrice || 0,
            volume24hKrw: 0,
            volume24hForeignKrw: null,
            isListed: true,
            cmcSlug: undefined,
            koreanName: master?.name_ko,
            displayName:
              master?.name_ko || master?.name_en || row.symbol,
          };
        } catch (e) {
          console.error(`[API] Error mapping ${row.symbol}:`, e);
          return null;
        }
      })
      .filter((row: any) => row !== null);

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
