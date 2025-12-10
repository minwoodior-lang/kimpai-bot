import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function getSID(req: NextApiRequest, res: NextApiResponse): string {
  const cookieName = "kimpai_sid";
  const cookies = req.headers.cookie?.split(";") || [];
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  
  // 새 SID 생성
  const newSID = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader("Set-Cookie", `${cookieName}=${encodeURIComponent(newSID)}; Path=/; Max-Age=2592000; HttpOnly`);
  return newSID;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sid = getSID(req, res);
    const { path } = req.body;
    
    // IP 주소 가져오기 (x-forwarded-for 우선)
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() 
      || req.socket.remoteAddress 
      || "unknown";
    
    const ipHash = hashIP(ip);
    const userAgent = req.headers["user-agent"] || "";

    // Supabase에 upsert
    const { error } = await supabase
      .from("analytics_sessions")
      .upsert(
        {
          sid,
          path_last: path || "/",
          user_agent: userAgent,
          ip_hash: ipHash,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "sid" }
      );

    if (error) {
      console.error("[Analytics] Upsert error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    console.log(`[Heartbeat] Session updated: ${sid} -> ${path}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[Heartbeat Error]:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
