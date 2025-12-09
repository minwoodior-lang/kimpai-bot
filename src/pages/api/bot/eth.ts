import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 실제 구현시 OI, Funding, 변동폭 실시간 계산
    const data = {
      oi: (Math.random() * 10 - 5).toFixed(2),
      fund: (Math.random() * 0.1 - 0.05).toFixed(4),
      bias: Math.random() > 0.5 ? "Long" : "Short",
      vol_prev: (Math.random() * 3).toFixed(2),
      vol_now: (Math.random() * 5).toFixed(2),
      ai_line: "변동성이 높아지고 있으며, 펀딩율이 상승세를 보임.",
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("/api/bot/eth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
