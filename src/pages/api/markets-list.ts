import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface ExchangeMarket {
  id: string;
  exchange: string;
  market: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  isDomestic: boolean;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExchangeMarket[]>
) {
  try {
    const filePath = path.join(process.cwd(), "data", "exchange_markets.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const markets = JSON.parse(fileContent) as ExchangeMarket[];

    res.status(200).json(markets);
  } catch (error) {
    console.error("Failed to read markets:", error);
    res.status(500).json([]);
  }
}
