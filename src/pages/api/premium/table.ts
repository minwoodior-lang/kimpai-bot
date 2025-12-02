import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// 캐시 무효화: 항상 최신 데이터 반환
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PremiumTableRow {
  symbol: string;
  name: string;
  koreanName: string;
  koreanPrice: number;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  volume24hKrw: number;
  volume24hUsdt: number | null;
  volume24hForeignKrw: number | null;
  change24h: number | null;
  high24h: number;
  low24h: number;
  domesticExchange?: string;
  foreignExchange?: string;
  isListed: boolean;
  cmcSlug?: string;
  name_ko?: string;
  name_en?: string;
  icon_url?: string;
}

interface PremiumTableResponse {
  success: boolean;
  data: PremiumTableRow[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
  totalCoins: number;
  listedCoins: number;
}

interface ExchangePriceRecord {
  id: number;
  exchange: string;
  symbol: string;
  base: string;
  quote: string;
  price: number;
  volume_24h: number | null;
  change_24h: number | null;
  created_at: string;
}

interface CoinMetadata {
  symbol: string;
  name_ko: string;
  name_en: string;
  cmcSlug?: string;
}

const VOLUME_ANOMALY_THRESHOLD = 50;

// =======================
//  메타데이터 캐시
// =======================
let cachedMetadata: Map<string, CoinMetadata> = new Map();
let lastMetadataFetch = 0;
const METADATA_CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * exchange_markets 테이블에서 메타데이터 수집
 * - base_symbol
 * - name_ko
 * - name_en
 */
async function fetchCoinMetadata(): Promise<Map<string, CoinMetadata>> {
  const now = Date.now();
  if (cachedMetadata.size > 0 && now - lastMetadataFetch < METADATA_CACHE_TTL) {
    return cachedMetadata;
  }

  const metadata = new Map<string, CoinMetadata>();

  try {
    // exchange_markets 테이블에서 직접 수집
    const { data: marketData } = await supabase
      .from("exchange_markets")
      .select("base_symbol, name_ko, name_en")
      .limit(2000);

    if (marketData && Array.isArray(marketData)) {
      const processed = new Set<string>();
      for (const row of marketData as any[]) {
        const symbol = (row.base_symbol || "").toUpperCase();
        if (symbol && !processed.has(symbol)) {
          processed.add(symbol);
          const autoSlug =
            symbol
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "") || undefined;

          metadata.set(symbol, {
            symbol,
            name_ko: row.name_ko || symbol,
            name_en: row.name_en || symbol,
            cmcSlug: autoSlug,
          });
        }
      }
    }

    cachedMetadata = metadata;
    lastMetadataFetch = now;
  } catch (error) {
    console.error("Failed to fetch coin metadata:", error);
  }

  return metadata;
}

function parseExchangeParam(param: string): { exchange: string; quote: string } {
  const parts = param.split("_");
  if (parts.length === 2) {
    return { exchange: parts[0].toLowerCase(), quote: parts[1].toUpperCase() };
  }
  return { exchange: param.toLowerCase(), quote: "USDT" };
}

async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    return data.rates.KRW || 1400;
  } catch {
    return 1400;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PremiumTableResponse | { error: string; retryAfter?: number }>
) {
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    res.setHeader("Retry-After", String(rateCheck.retryAfter || 2));
    return res.status(429).json({
      error: "Too many requests",
      retryAfter: rateCheck.retryAfter,
    } as { error: string; retryAfter?: number });
  }

  try {
    const domesticParam = (req.query.domestic as string) || "UPBIT_KRW";
    const foreignParam = (req.query.foreign as string) || "OKX_USDT";

    const domestic = parseExchangeParam(domesticParam);
    const foreign = parseExchangeParam(foreignParam);

    const [fxRate, metadata] = await Promise.all([
      fetchExchangeRate(),
      fetchCoinMetadata(),
    ]);

    const [domesticResult, foreignResult, krwResult, usdtResult] = await Promise.all([
      supabase
        .from("exchange_prices")
        .select("*")
        .eq("exchange", domestic.exchange)
        .eq("quote", domestic.quote)
        .order("created_at", { ascending: false })
        .limit(1000) as any,
      supabase
        .from("exchange_prices")
        .select("*")
        .eq("exchange", foreign.exchange)
        .eq("quote", foreign.quote)
        .order("created_at", { ascending: false })
        .limit(1000) as any,
      supabase
        .from("exchange_prices")
        .select("*")
        .eq("quote", "KRW")
        .order("created_at", { ascending: false })
        .limit(1000) as any,
      supabase
        .from("exchange_prices")
        .select("*")
        .eq("quote", "USDT")
        .order("created_at", { ascending: false })
        .limit(1000) as any,
    ]);

    if (domesticResult.error) {
      console.error("Database error:", domesticResult.error.message);
      return res.status(200).json({
        success: true,
        data: [],
        averagePremium: 0,
        fxRate,
        updatedAt: new Date().toISOString(),
        domesticExchange: domesticParam,
        foreignExchange: foreignParam,
        totalCoins: 0,
        listedCoins: 0,
      });
    }

    const domesticMap = new Map<string, ExchangePriceRecord>();
    const foreignMap = new Map<string, ExchangePriceRecord>();
    const krwPriceMap = new Map<string, ExchangePriceRecord>();
    const usdtPriceMap = new Map<string, ExchangePriceRecord>();

    for (const record of domesticResult.data || []) {
      if (!domesticMap.has(record.symbol)) {
        domesticMap.set(record.symbol, record);
      }
    }

    for (const record of foreignResult.data || []) {
      if (!foreignMap.has(record.symbol)) {
        foreignMap.set(record.symbol, record);
      }
    }

    for (const record of krwResult.data || []) {
      if (!krwPriceMap.has(record.symbol)) {
        krwPriceMap.set(record.symbol, record);
      }
    }

    for (const record of usdtResult.data || []) {
      if (!usdtPriceMap.has(record.symbol)) {
        usdtPriceMap.set(record.symbol, record);
      }
    }

    const btcKrwRecord = krwPriceMap.get("BTC");
    const btcKrwPrice = btcKrwRecord ? Number(btcKrwRecord.price) : 0;
    const btcUsdtRecord = usdtPriceMap.get("BTC");
    const btcUsdtPrice = btcUsdtRecord ? Number(btcUsdtRecord.price) : 0;

    const tableData: PremiumTableRow[] = [];
    let latestTimestamp = "";
    let listedCount = 0;

    const allDomesticSymbols = Array.from(domesticMap.keys());

    const sortedSymbols = allDomesticSymbols.sort((a, b) => {
      const priorityOrder = ["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE", "AVAX"];
      const aIdx = priorityOrder.indexOf(a);
      const bIdx = priorityOrder.indexOf(b);

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      const aRecord = domesticMap.get(a);
      const bRecord = domesticMap.get(b);
      const aVolume = Number(aRecord?.volume_24h) || 0;
      const bVolume = Number(bRecord?.volume_24h) || 0;
      return bVolume - aVolume;
    });

    for (const symbol of sortedSymbols) {
      const domesticRecord = domesticMap.get(symbol);
      if (!domesticRecord) continue;

      const foreignRecord = foreignMap.get(symbol);
      const coinMeta = metadata.get(symbol.toUpperCase());

      let domesticPriceKrw = Number(domesticRecord.price);

      if (domestic.quote === "USDT") {
        domesticPriceKrw = Number(domesticRecord.price) * fxRate;
      } else if (domestic.quote === "BTC") {
        if (symbol === "BTC") {
          domesticPriceKrw = btcKrwPrice > 0 ? btcKrwPrice : btcUsdtPrice * fxRate;
        } else if (btcKrwPrice > 0) {
          domesticPriceKrw = Number(domesticRecord.price) * btcKrwPrice;
        } else if (btcUsdtPrice > 0) {
          domesticPriceKrw = Number(domesticRecord.price) * btcUsdtPrice * fxRate;
        }
      }

      const domesticVolumeKrw = Number(domesticRecord.volume_24h) || 0;

      let globalPriceUsd: number | null = null;
      let globalPriceKrw: number | null = null;
      let foreignVolumeUsdt: number | null = null;
      let foreignVolumeKrw: number | null = null;
      let premium: number | null = null;
      let isListed = false;

      if (foreignRecord) {
        isListed = true;
        listedCount++;

        if (foreign.quote === "KRW") {
          globalPriceKrw = Number(foreignRecord.price);
          globalPriceUsd = globalPriceKrw / fxRate;
        } else if (foreign.quote === "USDT") {
          globalPriceUsd = Number(foreignRecord.price);
          globalPriceKrw = globalPriceUsd * fxRate;
        } else if (foreign.quote === "BTC") {
          if (symbol === "BTC") {
            globalPriceUsd = btcUsdtPrice;
            globalPriceKrw = btcUsdtPrice * fxRate;
          } else if (btcUsdtPrice > 0) {
            globalPriceUsd = Number(foreignRecord.price) * btcUsdtPrice;
            globalPriceKrw = globalPriceUsd * fxRate;
          }
        }

        const foreignVolumeRaw = Number(foreignRecord.volume_24h) || 0;
        if (foreign.quote === "KRW") {
          foreignVolumeUsdt = foreignVolumeRaw / fxRate;
        } else {
          foreignVolumeUsdt = foreignVolumeRaw;
        }
        foreignVolumeKrw = foreignVolumeUsdt * fxRate;

        if (
          domesticVolumeKrw > 0 &&
          foreignVolumeKrw > domesticVolumeKrw * VOLUME_ANOMALY_THRESHOLD
        ) {
          console.warn(
            `[Volume Anomaly] ${symbol}: Foreign volume ${foreignVolumeKrw} > Domestic ${domesticVolumeKrw} * ${VOLUME_ANOMALY_THRESHOLD}`
          );
          foreignVolumeUsdt = null;
          foreignVolumeKrw = null;
        }

        if (globalPriceKrw && globalPriceKrw > 0) {
          premium = ((domesticPriceKrw - globalPriceKrw) / globalPriceKrw) * 100;
          premium = Math.round(premium * 100) / 100;
        }
      }

      tableData.push({
        symbol,
        name: coinMeta?.name_en || symbol,
        koreanName: coinMeta?.name_ko || symbol,
        koreanPrice: Math.round(domesticPriceKrw),
        globalPrice: globalPriceUsd,
        globalPriceKrw: globalPriceKrw ? Math.round(globalPriceKrw) : null,
        premium,
        volume24hKrw: Math.round(domesticVolumeKrw),
        volume24hUsdt: foreignVolumeUsdt,
        volume24hForeignKrw: foreignVolumeKrw ? Math.round(foreignVolumeKrw) : null,
        change24h: foreignRecord
          ? Math.round((Number(foreignRecord.change_24h) || 0) * 100) / 100
          : null,
        high24h: Math.round(domesticPriceKrw * 1.01),
        low24h: Math.round(domesticPriceKrw * 0.99),
        domesticExchange: domestic.exchange.toUpperCase(),
        foreignExchange: foreignRecord
          ? foreignRecord.exchange.toUpperCase()
          : foreign.exchange.toUpperCase(),
        isListed,
        cmcSlug: coinMeta?.cmcSlug,
        name_ko: coinMeta?.name_ko || symbol,
        name_en: coinMeta?.name_en || symbol,
        icon_url: null,
      });

      if (!latestTimestamp || domesticRecord.created_at > latestTimestamp) {
        latestTimestamp = domesticRecord.created_at;
      }
    }

    const listedData = tableData.filter((row) => row.isListed && row.premium !== null);
    const averagePremium =
      listedData.length > 0
        ? listedData.reduce((acc, row) => acc + (row.premium || 0), 0) /
          listedData.length
        : 0;

    res.status(200).json({
      success: true,
      data: tableData,
      averagePremium: Math.round(averagePremium * 100) / 100,
      fxRate: Math.round(fxRate * 10) / 10,
      updatedAt: latestTimestamp || new Date().toISOString(),
      domesticExchange: domesticParam,
      foreignExchange: foreignParam,
      totalCoins: tableData.length,
      listedCoins: listedCount,
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(200).json({
      success: true,
      data: [],
      averagePremium: 0,
      fxRate: 1400,
      updatedAt: new Date().toISOString(),
      domesticExchange: "UPBIT_KRW",
      foreignExchange: "OKX_USDT",
      totalCoins: 0,
      listedCoins: 0,
    });
  }
}
