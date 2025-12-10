import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const COOKIE_NAME = "kimpai_sid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { path } = (req.body || {}) as { path?: string };

    // 로깅: 실제 사용 중인 환경 변수 확인
    console.log("[heartbeat] env SUPABASE_URL =", process.env.SUPABASE_URL);
    console.log("[heartbeat] env NEXT_PUBLIC_SUPABASE_URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[heartbeat] env SUPABASE_SERVICE_ROLE_KEY startsWith =", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));

    // 1) sid 쿠키 가져오기 / 없으면 생성
    let sid = req.cookies[COOKIE_NAME];
    let needSetCookie = false;

    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      needSetCookie = true;
    }

    // 2) IP 해시, UA
    const xfwd = (req.headers["x-forwarded-for"] as string) || "";
    const ip = xfwd.split(",")[0].trim() || "";
    const ipHash = ip
      ? crypto.createHash("sha256").update(ip).digest("hex")
      : null;

    const userAgent = (req.headers["user-agent"] as string) || null;
    const now = new Date().toISOString();

    // 3) Supabase 클라이언트 생성 - SUPABASE_URL 사용 (non-public)
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[heartbeat] missing supabase env", {
        supabaseUrl,
        supabaseServiceKeyExists: !!supabaseServiceKey,
      });
      return res.status(500).json({
        ok: false,
        error: "missing_env",
        message: "Missing Supabase environment variables",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4) 최소 필드만 upsert (sid 기준)
    const { error } = await supabase
      .from("analytics_sessions")
      .upsert(
        {
          sid,
          path_last: path || null,
          last_seen: now,
          user_agent: userAgent,
          ip_hash: ipHash,
        },
        { onConflict: "sid" }
      );

    if (error) {
      console.error("[analytics] heartbeat upsert error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return res.status(500).json({
        ok: false,
        error: "db_error",
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    // 5) 새 sid면 쿠키 세팅
    if (needSetCookie) {
      res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax`
      );
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[analytics] heartbeat handler error", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
