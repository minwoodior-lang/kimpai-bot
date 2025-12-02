import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface MasterSymbol {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  icon_path?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MasterSymbol[]>
) {
  try {
    const filePath = path.join(process.cwd(), "data", "master_symbols.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const symbols = JSON.parse(fileContent) as MasterSymbol[];

    res.status(200).json(symbols);
  } catch (error) {
    console.error("Failed to read master symbols:", error);
    res.status(500).json([]);
  }
}
