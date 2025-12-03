import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface GlobalMetricsResponse {
  fx: {
    usdKrw: number;
    change24h: number;
  };
  usdt: {
    krw: number;
    change24h: number;
  };
  global: {
    btcDominance: number;
    marketCapKrw: number;
    marketCapChange24h: number;
    volume24hKrw: number;
    volume24hChange24h: number;
  };
  concurrentUsers: number;
}

let cachedMetrics: GlobalMetricsResponse | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const DEFAULT_RESPONSE: GlobalMetricsResponse = {
  fx: { usdKrw: 1365, change24h: 0 },
  usdt: { krw: 1486, change24h: 0 },
  global: {
    btcDominance: 42.3,
    marketCapKrw: 4.741e15,
    marketCapChange24h: 1.16,
    volume24hKrw: 2.47e14,
    volume24hChange24h: 5.12,
  },
  concurrentUsers: 0,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalMetricsResponse>
) {
  try {
    // 캐시 확인
    if (cachedMetrics && Date.now() - cacheTime < CACHE_DURATION) {
      return res.status(200).json(cachedMetrics);
    }

    const metricsData: GlobalMetricsResponse = JSON.parse(JSON.stringify(DEFAULT_RESPONSE));

    // 1. CoinGecko 글로벌 메트릭 (USD/KRW, BTC 점유율, 시총, 거래량)
    try {
      const geckoRes = await axios.get(
        "https://api.coingecko.com/api/v3/global?vs_currency=krw",
        { timeout: 5000 }
      );

      if (geckoRes.data?.data) {
        const data = geckoRes.data.data;

        // USD/KRW 환율 계산 (BTC의 USD 가격과 KRW 가격으로 역산)
        if (data.btc_market_cap?.usd && data.btc_market_cap?.krw) {
          const calculatedRate = Math.round(data.btc_market_cap.krw / data.btc_market_cap.usd);
          metricsData.fx.usdKrw = calculatedRate;
          console.log("[CoinGecko] USD/KRW:", calculatedRate);
        }

        // BTC Dominance
        if (data.btc_market_cap_percentage?.btc) {
          metricsData.global.btcDominance = Number(data.btc_market_cap_percentage.btc.toFixed(1));
          console.log("[CoinGecko] BTC Dominance:", metricsData.global.btcDominance);
        }

        // 시가총액 (KRW)
        if (data.total_market_cap?.krw) {
          metricsData.global.marketCapKrw = data.total_market_cap.krw;
          console.log("[CoinGecko] Market Cap KRW:", metricsData.global.marketCapKrw);
        }

        // 24시간 거래량 (KRW)
        if (data.total_volume?.krw) {
          metricsData.global.volume24hKrw = data.total_volume.krw;
          console.log("[CoinGecko] 24h Volume KRW:", metricsData.global.volume24hKrw);
        }

        // 시가총액 변화율
        if (data.market_cap_change_percentage_24h_usd !== undefined) {
          metricsData.global.marketCapChange24h = Number(data.market_cap_change_percentage_24h_usd.toFixed(2));
        }
      }
    } catch (err) {
      console.error("[CoinGecko Error]:", err instanceof Error ? err.message : String(err));
    }

    // 2. Bithumb USDT/KRW 시세
    try {
      const bithumbRes = await axios.get(
        "https://api.bithumb.com/public/ticker/USDT_KRW",
        { timeout: 3000 }
      );

      if (bithumbRes.data?.data) {
        const data = bithumbRes.data.data;
        const closingPrice = parseFloat(data.closing_price);
        const prevClosingPrice = parseFloat(data.prev_closing_price);

        if (!isNaN(closingPrice)) {
          metricsData.usdt.krw = closingPrice;

          // 변화율 계산
          if (!isNaN(prevClosingPrice) && prevClosingPrice > 0) {
            const change = ((closingPrice - prevClosingPrice) / prevClosingPrice) * 100;
            metricsData.usdt.change24h = Number(change.toFixed(2));
          } else if (!isNaN(parseFloat(data.fluctate_rate_24h))) {
            metricsData.usdt.change24h = Number(parseFloat(data.fluctate_rate_24h).toFixed(2));
          }

          console.log("[Bithumb] USDT/KRW:", metricsData.usdt.krw, "Change:", metricsData.usdt.change24h);
        }
      }
    } catch (err) {
      console.error("[Bithumb Error]:", err instanceof Error ? err.message : String(err));
    }

    // 3. 동시접속자 (Supabase active_sessions)
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

    // 캐시 업데이트
    cachedMetrics = metricsData;
    cacheTime = Date.now();

    res.setHeader("Cache-Control", "no-cache, max-age=0");
    res.status(200).json(metricsData);
  } catch (err) {
    console.error("[API Error]:", err);
    res.status(500).json(DEFAULT_RESPONSE);
  }
}
