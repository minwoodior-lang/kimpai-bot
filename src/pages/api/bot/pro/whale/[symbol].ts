import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ error: "Symbol is required" });
    }

    const data = {
      symbol: symbol.toUpperCase(),
      net_inflow: (Math.random() * 1000 + 100).toFixed(0),
      avg_entry: (Math.random() * 500 + 1000).toFixed(2),
      duration: "2-3시간",
      ai_line: `${symbol.toUpperCase()} 고래 매집 활동 포착. 강한 수요 신호 감지됨.`,
      prob: Math.floor(Math.random() * 20 + 75),
      range: (Math.random() * 5 + 2).toFixed(2),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/pro/whale/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
