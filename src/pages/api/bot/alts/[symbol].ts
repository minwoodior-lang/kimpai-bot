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
      vol_change: (Math.random() * 20 - 10).toFixed(2),
      price_change: (Math.random() * 10 - 5).toFixed(2),
      fund: (Math.random() * 0.1 - 0.05).toFixed(4),
      ai_line: `${symbol.toUpperCase()} 변동성 증가 신호 포착. 단기 상승세 예상됨.`,
      prob: Math.floor(Math.random() * 30 + 60),
      range: (Math.random() * 5 + 1).toFixed(2),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/alts/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
