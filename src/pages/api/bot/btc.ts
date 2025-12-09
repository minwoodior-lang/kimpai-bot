import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 실제 구현시 실시간 데이터 사용
    // 현재는 샘플 데이터 반환
    const data = {
      prev: (Math.random() * 2 - 1).toFixed(2),
      current: (Math.random() * 2 + 0.5).toFixed(2),
      trend: "높음",
      ai_line: "현재 추세상 상승세가 강함. 매수세가 우위를 보이고 있습니다.",
      prob: 75,
      future_move: (Math.random() * 3 + 1).toFixed(2),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("/api/bot/btc error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
