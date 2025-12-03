import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface GlobalMetrics {
  usdKrw: number;
  usdKrwChange: number;
  tetherKrw: number;
  tetherChange: number;
  btcDominance: number;
  marketCapKrw: number;
  marketCapChange: number;
  volume24hKrw: number;
  volume24hChange: number;
  concurrentUsers: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalMetrics>
) {
  try {
    // 데이터는 기존 수집 시스템에서 활용 (기본값 반환)
    // 실제 운영 환경에서는 priceWorker나 글로벌 API에서 실시간 데이터 취득
    const metricsData: GlobalMetrics = {
      usdKrw: 1285,
      usdKrwChange: 0.15,
      tetherKrw: 1284,
      tetherChange: 0.12,
      btcDominance: 42.3,
      marketCapKrw: 2850e12,
      marketCapChange: 2.34,
      volume24hKrw: 185e12,
      volume24hChange: 5.12,
      concurrentUsers: 380,
    };

    // 동시접속자 카운트 (Supabase)
    try {
      const { count } = await supabase
        .from("active_sessions")
        .select("*", { count: "exact" })
        .gt("last_seen", new Date(Date.now() - 2 * 60 * 1000).toISOString())
        .throwOnError();

      if (count !== null) {
        metricsData.concurrentUsers = count;
      }
    } catch (err) {
      // Fallback 기본값 유지
    }

    res.setHeader("Cache-Control", "no-cache, max-age=0");
    res.status(200).json(metricsData);
  } catch (err) {
    res.status(500).json({
      usdKrw: 1285,
      usdKrwChange: 0,
      tetherKrw: 1284,
      tetherChange: 0,
      btcDominance: 42.3,
      marketCapKrw: 2850e12,
      marketCapChange: 0,
      volume24hKrw: 185e12,
      volume24hChange: 0,
      concurrentUsers: 0,
    });
  }
}
