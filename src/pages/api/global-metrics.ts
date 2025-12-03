import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

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

let cachedMetrics: GlobalMetrics | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalMetrics>
) {
  try {
    // 캐시 확인
    if (cachedMetrics && Date.now() - cacheTime < CACHE_DURATION) {
      return res.status(200).json(cachedMetrics);
    }

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

    // 1. USD/KRW 환율 가져오기 (FX API)
    try {
      const fxRes = await axios.get("https://api.exchangerate.host/latest?base=USD&symbols=KRW", {
        timeout: 3000,
      });
      if (fxRes.data?.rates?.KRW) {
        metricsData.usdKrw = Math.round(fxRes.data.rates.KRW);
      }
    } catch (err) {
      // Fallback 사용
    }

    // 2. Bithumb USDT/KRW 시세
    try {
      const bithumbRes = await axios.get("https://api.bithumb.com/public/ticker/USDT_KRW", {
        timeout: 3000,
      });
      if (bithumbRes.data?.data?.closing_price) {
        const price = parseFloat(bithumbRes.data.data.closing_price);
        const change = parseFloat(bithumbRes.data.data.fluctate_rate_24h) || 0;
        metricsData.tetherKrw = Math.round(price);
        metricsData.tetherChange = change;
      }
    } catch (err) {
      // Fallback 사용
    }

    // 3. 동시접속자 카운트 (Supabase)
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
      // Fallback 사용
    }

    // 캐시 업데이트
    cachedMetrics = metricsData;
    cacheTime = Date.now();

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
