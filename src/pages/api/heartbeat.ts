import type { NextApiRequest, NextApiResponse } from "next";
import { recordSession } from "@/lib/sessionCache";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    // 메모리 캐시에 세션 기록
    recordSession(sessionId);
    console.log("[Heartbeat] Session recorded:", sessionId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[Heartbeat Error]:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
