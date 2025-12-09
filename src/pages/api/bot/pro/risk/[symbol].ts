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

    const patterns = ["Double Top", "Head and Shoulders", "Inverse V", "Triple Top"];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    const data = {
      symbol: symbol.toUpperCase(),
      vol: (Math.random() * 50 - 20).toFixed(2),
      fund: (Math.random() * 0.1 - 0.05).toFixed(4),
      pl_desc: "수익 실현 중",
      pattern_name: pattern,
      prob: Math.floor(Math.random() * 20 + 70),
      min: (Math.random() * 5 - 5).toFixed(2),
      max: (Math.random() * 5 - 2).toFixed(2),
      entry: "현재 신규 진입 권장하지 않음",
      manage: "기존 포지션 점진적 익절 권장",
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(`/api/bot/pro/risk/[symbol] error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
