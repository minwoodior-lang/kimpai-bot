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
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  // master_symbols.json은 배열이므로 객체로 변환
  if (Array.isArray(data)) {
    const map: Record<string, any> = {};
    for (const item of data) {
      map[item.base_symbol] = item;
    }
    return map;
  }
  return data;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const premium = loadPremium();
    const meta = loadMeta();

    const result = premium
      .map((row: any) => {
        try {
          return attachMetadata(row, meta);
        } catch (err) {
          console.error("[attachMetadata] error:", row, err);
          return {
            ...row,
            nameKo: null,
            nameEn: null,
            iconUrl: null,
            displayName: row.symbol || "Unknown",
            koreanPrice: row.koreanPrice || 0,
            globalPriceKrw: row.globalPriceKrw || 0,
            premium: row.premium ?? 0,
          };
        }
      })
      .filter(
        (row: any) =>
          row.koreanPrice !== null &&
          row.globalPriceKrw !== null &&
          row.premium !== null
      );

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("[API] /premium/table error:", err);
    return res.status(500).json({ data: [] });
  }
}
