import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

interface PremiumTableRow {
  symbol: string;
  name_ko: string;
  name_en: string;
  icon_url: string | null;
  koreanPrice: number;
  globalPriceKrw: number;
  premium: number;
  domesticExchange: string;
  foreignExchange: string;
  timestamp: string;
}

interface PremiumTableResponse {
  success: boolean;
  data: PremiumTableRow[];
  averagePremium: number;
  timestamp: string;
}

export const dynamic = "force-dynamic";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    PremiumTableResponse | { error: string; retryAfter?: number }
  >
) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    res.setHeader("Retry-After", String(rateCheck.retryAfter || 2));
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: rateCheck.retryAfter,
    });
  }

  try {
    const dataDir = path.join(process.cwd(), "data");

    // 프리미엄 데이터 로드
    const premiumPath = path.join(dataDir, "premiumTable.json");
    let premiumData: any[] = [];
    if (fs.existsSync(premiumPath)) {
      const data = fs.readFileSync(premiumPath, "utf-8");
      premiumData = JSON.parse(data);
    }

    // 메타데이터 로드
    const metaPath = path.join(dataDir, "symbolMetadata.json");
    let metaData: Record<string, any> = {};
    if (fs.existsSync(metaPath)) {
      const data = fs.readFileSync(metaPath, "utf-8");
      const metaArray = JSON.parse(data);
      metaData = Object.fromEntries(
        metaArray.map((item: any) => [item.base_symbol, item])
      );
    }

    // 메타데이터와 매핑
    const mapped: PremiumTableRow[] = premiumData.map((item: any) => {
      const m = metaData[item.symbol] || {};
      return {
        symbol: item.symbol,
        name_ko: m.name_ko || item.symbol,
        name_en: m.name_en || item.symbol,
        icon_url: m.icon_url || null,
        koreanPrice: item.koreanPrice,
        globalPriceKrw: item.globalPriceKrw,
        premium: item.premium,
        domesticExchange: item.domesticExchange || "UPBIT",
        foreignExchange: item.foreignExchange || "OKX",
        timestamp: item.timestamp,
      };
    });

    const averagePremium =
      mapped.length > 0
        ? mapped.reduce((sum, item) => sum + item.premium, 0) / mapped.length
        : 0;

    return res.status(200).json({
      success: true,
      data: mapped,
      averagePremium,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[table.ts] 오류:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch premium data",
      data: [],
      averagePremium: 0,
      timestamp: new Date().toISOString(),
    } as any);
  }
}
