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
const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalMetrics>
) {
  try {
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
      concurrentUsers: 0,
    };

    // 모든 글로벌 데이터를 CoinGecko 한 곳에서 가져오기
    // USD/KRW, BTC Dominance, 시총, 거래량 모두 포함
    try {
      const geckoRes = await axios.get(
        "https://api.coingecko.com/api/v3/global?vs_currency=krw",
        { timeout: 5000 }
      );

      if (geckoRes.data?.data) {
        const data = geckoRes.data.data;

        // USD/KRW (CoinGecko의 KRW가 기준이므로 역산)
        if (data.btc_market_cap?.usd && data.btc_market_cap?.krw) {
          const usdKrwRate = Math.round(data.btc_market_cap.krw / data.btc_market_cap.usd);
          metricsData.usdKrw = usdKrwRate;
          console.log("[CoinGecko] USD/KRW:", usdKrwRate);
        }

        // BTC Dominance
        if (data.btc_market_cap_percentage?.btc) {
          metricsData.btcDominance = Number(data.btc_market_cap_percentage.btc.toFixed(1));
          console.log("[CoinGecko] BTC Dominance:", metricsData.btcDominance);
        }

        // 시가총액
        if (data.total_market_cap?.krw) {
          metricsData.marketCapKrw = data.total_market_cap.krw;
          console.log("[CoinGecko] Market Cap:", metricsData.marketCapKrw);
        }

        // 24시간 거래량
        if (data.total_volume?.krw) {
          metricsData.volume24hKrw = data.total_volume.krw;
          console.log("[CoinGecko] 24h Volume:", metricsData.volume24hKrw);
        }

        // 변화율 (시총, 거래량 24h 변화율)
        if (data.market_cap_change_percentage_24h_usd) {
          metricsData.marketCapChange = Number(data.market_cap_change_percentage_24h_usd.toFixed(2));
        }
      }
    } catch (err) {
      console.error("[CoinGecko Error]:", err instanceof Error ? err.message : String(err));
    }

    // Bithumb USDT/KRW
    try {
      const bithumbRes = await axios.get(
        "https://api.bithumb.com/public/ticker/USDT_KRW",
        { timeout: 3000 }
      );

      if (bithumbRes.data?.data) {
        const data = bithumbRes.data.data;
        const price = parseFloat(data.closing_price);
        const change = parseFloat(data.fluctate_rate_24h) || 0;

        if (!isNaN(price)) {
          metricsData.tetherKrw = Math.round(price);
          metricsData.tetherChange = Number(change.toFixed(2));
          console.log("[Bithumb] USDT/KRW:", metricsData.tetherKrw, "Change:", metricsData.tetherChange);
        }
      }
    } catch (err) {
      console.error("[Bithumb Error]:", err instanceof Error ? err.message : String(err));
    }

    // 동시접속자 (Supabase active_sessions)
    try {
      const { count } = await supabase
        .from("active_sessions")
        .select("*", { count: "exact" })
        .gt("last_seen", new Date(Date.now() - 2 * 60 * 1000).toISOString());

      if (count !== null) {
        metricsData.concurrentUsers = count;
        console.log("[Supabase] Active Sessions:", count);
      }
    } catch (err) {
      console.error("[Supabase Error]:", err instanceof Error ? err.message : String(err));
    }

    cachedMetrics = metricsData;
    cacheTime = Date.now();

    res.setHeader("Cache-Control", "no-cache, max-age=0");
    res.status(200).json(metricsData);
  } catch (err) {
    console.error("[API Error]:", err);
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
