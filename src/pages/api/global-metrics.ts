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

    // 1. USD/KRW 환율
    try {
      const fxRes = await axios.get("https://api.exchangerate.host/latest?base=USD&symbols=KRW", {
        timeout: 3000,
      });
      if (fxRes.data?.rates?.KRW) {
        metricsData.usdKrw = Math.round(fxRes.data.rates.KRW);
        console.log("[FX API] USD/KRW:", metricsData.usdKrw);
      }
    } catch (err) {
      console.error("[FX API Error]:", err instanceof Error ? err.message : String(err));
    }

    // 2. Bithumb USDT/KRW
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
          metricsData.tetherChange = Number((change).toFixed(2));
          console.log("[Bithumb] USDT/KRW:", metricsData.tetherKrw, "change:", metricsData.tetherChange);
        }
      }
    } catch (err) {
      console.error("[Bithumb Error]:", err instanceof Error ? err.message : String(err));
    }

    // 3. 글로벌 메트릭 (CoinGecko)
    try {
      const geckoRes = await axios.get(
        "https://api.coingecko.com/api/v3/global?vs_currency=krw",
        { timeout: 3000 }
      );
      if (geckoRes.data?.data) {
        const data = geckoRes.data.data;
        
        if (data.btc_market_cap_percentage) {
          metricsData.btcDominance = parseFloat(data.btc_market_cap_percentage.btc) || 42.3;
        }
        if (data.total_market_cap?.krw) {
          metricsData.marketCapKrw = data.total_market_cap.krw;
        }
        if (data.total_volume?.krw) {
          metricsData.volume24hKrw = data.total_volume.krw;
        }
        console.log("[CoinGecko] BTC Dom:", metricsData.btcDominance, "MarketCap:", metricsData.marketCapKrw);
      }
    } catch (err) {
      console.error("[CoinGecko Error]:", err instanceof Error ? err.message : String(err));
    }

    // 4. 동시접속자
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
