import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = {
      kimp: (Math.random() * 3 + 0.5).toFixed(2),
      score: Math.floor(Math.random() * 4 + 6),
      ls_ratio: Math.random() > 0.5 ? "6:4" : "4:6",
      up_prob: Math.floor(Math.random() * 30 + 55),
      min: (Math.random() * 3 - 3).toFixed(2),
      max: (Math.random() * 3 + 3).toFixed(2),
      dp1: (Math.random() * 2000 + 40000).toFixed(0),
      dp2: (Math.random() * 2000 + 38000).toFixed(0),
      tp1: (Math.random() * 2000 + 45000).toFixed(0),
      tp2: (Math.random() * 2000 + 47000).toFixed(0),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("/api/bot/pro/btc error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
