import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";
import { UAParser } from "ua-parser-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ActiveUser {
  sid: string;
  path_last: string;
  last_seen: string;
  lastSeenAgo: string;
  user_agent: string;
  device: string;
  os: string;
  browser: string;
}

interface AnalyticsSummary {
  activeNow: number;
  todayVisitors: number;
  activeUsers: ActiveUser[];
  timestamp: string;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}초 전`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`;
  return `${Math.floor(diffSeconds / 86400)}일 전`;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsSummary | { error: string }>
) {
  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. 현재 접속자 (2분 이내)
    const { data: activeData, error: activeError } = await supabase
      .from("analytics_sessions")
      .select("sid", { count: "exact" })
      .gte("last_seen", twoMinutesAgo.toISOString());

    const activeNow = activeError ? 0 : (activeData?.length || 0);

    // 2. 오늘 방문자 수 (고유 sid)
    const { data: todayData, error: todayError } = await supabase
      .from("analytics_sessions")
      .select("sid")
      .gte("created_at", todayStart.toISOString());

    const todayVisitors = todayError 
      ? 0 
      : new Set(todayData?.map((d: any) => d.sid) || []).size;

    // 3. 활성 사용자 상세 (최근 접속 순, 최대 50개)
    const { data: usersData, error: usersError } = await supabase
      .from("analytics_sessions")
      .select("sid, path_last, last_seen, user_agent")
      .gte("last_seen", twoMinutesAgo.toISOString())
      .order("last_seen", { ascending: false })
      .limit(50);

    const activeUsers: ActiveUser[] = (usersData || []).map((row: any) => {
      const parser = new UAParser(row.user_agent || "");
      const result = parser.getResult();

      return {
        sid: row.sid,
        path_last: row.path_last || "/",
        last_seen: row.last_seen,
        lastSeenAgo: formatTimeAgo(row.last_seen),
        user_agent: row.user_agent || "-",
        device: result.device.type || "desktop",
        os: result.os.name || "-",
        browser: result.browser.name || "-",
      };
    });

    const summary: AnalyticsSummary = {
      activeNow,
      todayVisitors,
      activeUsers,
      timestamp: now.toISOString(),
    };

    res.setHeader("Cache-Control", "no-cache, no-store");
    return res.status(200).json(summary);
  } catch (err) {
    console.error("[Analytics Summary Error]:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export default withAdminAuth(handler);
