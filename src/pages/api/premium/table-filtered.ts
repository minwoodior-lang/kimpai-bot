import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

interface PriceEntry {
  price: number;
  ts: number;
  volume24hKrw?: number;
  volume24hQuote?: number;
  change24hRate?: number;
  change24hAbs?: number;
  high24h?: number;
  low24h?: number;
  prev_price?: number;
}

interface MarketStats {
  change24hRate?: number;
  change24hAbs?: number;
  high24h?: number;
  low24h?: number;
  volume24hQuote?: number;
}

type PricesMap = Record<string, PriceEntry>;
type MarketStatsMap = Record<string, MarketStats>;

// 메모리 캐시: 500ms~1초 TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry> = {};
// ✨ 캐시 TTL을 priceWorker 주기(300ms)보다 짧게 설정하여 실시간성 확보
// priceWorker가 WebSocket 가격을 prices.json에 병합하므로, 캐시만 줄이면 됨
const CACHE_TTL = 200; // 200ms (priceWorker 300ms 주기보다 짧게)

function getCacheKey(domestic: string, foreign: string): string {
  return `${domestic}:${foreign}`;
}

function getFromCache(key: string): any | null {
  const entry = memoryCache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete memoryCache[key];
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any): void {
  memoryCache[key] = { data, timestamp: Date.now() };
}

function loadJsonFile(filename: string): any {
  try {
    const file = path.join(process.cwd(), "data", filename);
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return filename.endsWith('.json') ? [] : {};
  }
}

function parseMarketParam(value: string): { exchange: string; quote: string } {
  const v = (value || "").trim();
  if (!v) return { exchange: "UPBIT", quote: "KRW" };

  // 바이낸스 선물 특수 처리 (BINANCE_FUTURES, BINANCE_FUTURES_USDT 둘 다 지원)
  if (v === "BINANCE_FUTURES") {
    return { exchange: "BINANCE_FUTURES", quote: "USDT" };
  }

  const parts = v.split("_").filter(Boolean);

  // EXCHANGE 하나만 온 경우 (OKX, BYBIT 등) → 기본 USDT
  if (parts.length === 1) {
    const ex = parts[0];
    const defaultQuote = ex === "UPBIT" ? "KRW" : "USDT";
    return { exchange: ex, quote: defaultQuote };
  }

  // 나머지는 "EXCHANGE_..._QUOTE" 형식 → 마지막만 quote, 나머지는 exchange
  const quote = parts[parts.length - 1];
  const exchange = parts.slice(0, -1).join("_");
  return { exchange, quote };
}

// 🔧 거래소 조합별 마켓 키 생성 헬퍼 함수
// 각 거래소 조합마다 독립적인 prices.json 키를 생성합니다
// 예시: "UPBIT:BTC:KRW", "BINANCE:BTC:USDT", "BINANCE_FUTURES:BTC:USDT"
function getDomesticMarketKey(symbol: string, exchange: string, quote: string): string {
  return `${exchange}:${symbol}:${quote}`;
}

function getForeignMarketKey(symbol: string, exchange: string, quote: string): string {
  return `${exchange}:${symbol}:${quote}`;
}

// ❌ WebSocket override 로직 제거:
// priceWorker가 이미 WebSocket 가격을 prices.json에 병합하고 있으므로
// API 레벨에서 별도 override가 불필요함 (프로세스 격리로 인해 작동도 안 함)

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { domestic = "UPBIT_KRW", foreign = "BINANCE_USDT", mode } = req.query;
    
    // FAST 모드: TOP 20만 반환 (1초 갱신용)
    const isFastMode = mode === "fast";

    // 메모리 캐시 체크 (200ms TTL - priceWorker 300ms 주기보다 짧게)
    const cacheKey = getCacheKey(domestic as string, foreign as string);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      // FAST 모드: TOP 20만 필터링
      if (isFastMode && cachedData.data) {
        const top20Set = new Set(cachedData.top20Symbols || []);
        return res.status(200).json({
          ...cachedData,
          data: cachedData.data.filter((row: any) => top20Set.has(row.symbol)),
        });
      }
      return res.status(200).json(cachedData);
    }

    const { exchange: domesticExchange, quote: domesticQuote } = parseMarketParam(domestic as string);
    const { exchange: foreignExchange, quote: foreignQuote } = parseMarketParam(foreign as string);

    const allMarkets = loadJsonFile("exchange_markets.json") as any[];
    const masterSymbols = loadJsonFile("master_symbols.json") as any[];
    const premiumTable = loadJsonFile("premiumTable.json") as any[];
    const prices = loadJsonFile("prices.json") as PricesMap;
    const marketStats = loadJsonFile("marketStats.json") as MarketStatsMap;
    
    // TOP 20 심볼 추출 (거래대금 기준)
    const top20Symbols = Object.entries(marketStats)
      .map(([key, stat]: [string, any]) => ({
        key,
        volume: stat?.volume24hQuote ?? 0,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20)
      .map((e) => e.key.split(":")[1]); // "EXCHANGE:SYMBOL:QUOTE" → "SYMBOL"
    const top20Set = new Set(top20Symbols);

    const masterMap = new Map(masterSymbols.map((s: any) => [s.symbol, s]));
    const premiumMap = new Map(premiumTable.map((p: any) => [p.symbol, p]));

    const fxRate = premiumTable[0]?.usdKrw || 1380;

    const filtered = allMarkets
      .filter((m) => {
        const matchExchange = m.exchange === domesticExchange;
        const matchQuote = m.quote === domesticQuote;
        return matchExchange && matchQuote;
      })
      .filter((m) => {
        // FAST 모드: TOP 20만 반환
        if (isFastMode) {
          const symbol = m.base.toUpperCase();
          return top20Set.has(symbol);
        }
        return true;
      })
      .map((market) => {
        const symbol = market.base.toUpperCase();
        const master = masterMap.get(symbol);
        const premiumRow = premiumMap.get(symbol);

        // 🔧 거래소 조합별 독립 계산: 드롭다운 변경 시 김프/해외가가 완전히 달라짐
        // 예시: UPBIT_KRW + BINANCE_USDT, UPBIT_KRW + BINANCE_FUTURES, BITHUMB_KRW + OKX_USDT 등
        const domesticPriceKey = getDomesticMarketKey(symbol, domesticExchange, domesticQuote);
        const foreignPriceKey = getForeignMarketKey(symbol, foreignExchange, foreignQuote);

        const domesticEntry = prices[domesticPriceKey];
        const foreignEntry = prices[foreignPriceKey];

        // 📌 1. 국내 현재가 KRW 환산 (koreanPrice)
        const domesticPriceRaw = domesticEntry?.price ?? null;
        let domesticPriceKrw: number | null = null;
        
        const btcKrwKey = `${domesticExchange}:BTC:KRW`;
        const btcKrw = prices[btcKrwKey]?.price ?? 0;

        if (domesticPriceRaw && domesticPriceRaw > 0) {
          if (domesticQuote === "KRW") {
            domesticPriceKrw = domesticPriceRaw;
          } else if (domesticQuote === "BTC") {
            if (btcKrw > 0) {
              domesticPriceKrw = domesticPriceRaw * btcKrw;
            }
          } else if (domesticQuote === "USDT") {
            domesticPriceKrw = domesticPriceRaw * fxRate;
          }
        }
        
        // 📌 2. 해외 현재가 KRW 환산 (foreignPriceKrw)
        // prices.json에서 해외 가격 가져오기 (priceWorker가 이미 WebSocket 가격을 병합함)
        const foreignPrice = foreignEntry?.price ?? null;

        let foreignPriceKrw: number | null = null;
        if (foreignPrice && foreignPrice > 0) {
          if (foreignQuote === "USDT") {
            foreignPriceKrw = foreignPrice * fxRate;
          } else if (foreignQuote === "BTC") {
            const btcPriceOrder = ["BINANCE:BTC:USDT", "OKX:BTC:USDT", "BITGET:BTC:USDT", "GATE:BTC:USDT", "MEXC:BTC:USDT"];
            let btcUsdtPrice = 0;
            for (const key of btcPriceOrder) {
              if (prices[key]?.price) {
                btcUsdtPrice = prices[key].price;
                break;
              }
            }
            foreignPriceKrw = foreignPrice * btcUsdtPrice * fxRate;
          } else {
            foreignPriceKrw = foreignPrice;
          }
        }

        // 📌 3. 김프 % + 김프 차액 계산 (조합별로 독립)
        // 드롭다운에서 foreignKey만 바뀌면 해외가/김프가 전부 달라짐
        let premiumRate: number | null = null;
        let premiumDiffKrw: number | null = null;
        if (domesticPriceKrw && foreignPriceKrw && foreignPriceKrw > 0) {
          premiumRate = ((domesticPriceKrw / foreignPriceKrw) - 1) * 100;
          premiumDiffKrw = domesticPriceKrw - foreignPriceKrw;
        }

        const shouldForcePlaceholder = BAD_ICON_SYMBOLS.includes(symbol);
        const baseIconUrl = master?.icon_path || premiumRow?.iconUrl || null;
        const iconUrl = shouldForcePlaceholder ? null : baseIconUrl;

        const cmcSlug = premiumRow?.cmcSlug || master?.cmc_slug || null;

        const changeRate = domesticEntry?.change24hRate ?? null;
        let changeAbsKrw = domesticEntry?.change24hAbs ?? null;
        let high24hKrw = domesticEntry?.high24h ?? null;
        let low24hKrw = domesticEntry?.low24h ?? null;

        // 🚨 IMPORTANT: 거래액(일) 로직
        // - 항상 선택된 domesticKey / foreignKey 기준으로만 계산
        // - premiumTable.volume24h* 에 의존 금지
        // - KRW/USDT/BTC 환산 규칙 외에는 임의로 수정 금지 (PM 협의 필수)
        // - prices와 marketStats의 volume24hQuote를 사용 (quote 기준 거래량)

        // 국내 거래소 거래액 계산 (prices 또는 marketStats 기반)
        let volume24hKrw: number | null = null;
        
        // prices.json의 volume24hQuote 우선 사용, 없으면 marketStats 확인
        const domesticVolumeQuote = domesticEntry?.volume24hQuote ?? marketStats[domesticPriceKey]?.volume24hQuote;

        if (domesticVolumeQuote != null && domesticVolumeQuote > 0) {
          const vol = domesticVolumeQuote;

          if (domesticQuote === "KRW") {
            // KRW 마켓: 이미 원화
            volume24hKrw = vol;
          } else if (domesticQuote === "USDT" && fxRate) {
            // USDT 마켓: USDT 거래대금 × 환율
            volume24hKrw = vol * fxRate;
          } else if (domesticQuote === "BTC" && btcKrw > 0) {
            // BTC 마켓: BTC 거래대금 × BTC/KRW 가격
            volume24hKrw = vol * btcKrw;
          }
        }

        // 가격 관련 KRW 환산 (changeAbs, high, low)
        if (domesticQuote === "USDT") {
          if (changeAbsKrw != null) changeAbsKrw = changeAbsKrw * fxRate;
          if (high24hKrw != null) high24hKrw = high24hKrw * fxRate;
          if (low24hKrw != null) low24hKrw = low24hKrw * fxRate;
        } else if (domesticQuote === "BTC") {
          if (btcKrw > 0) {
            if (changeAbsKrw != null) changeAbsKrw = changeAbsKrw * btcKrw;
            if (high24hKrw != null) high24hKrw = high24hKrw * btcKrw;
            if (low24hKrw != null) low24hKrw = low24hKrw * btcKrw;
          } else {
            changeAbsKrw = null;
            high24hKrw = null;
            low24hKrw = null;
          }
        }

        // 해외 거래소 거래액 계산 (prices 또는 marketStats 기반)
        let volume24hForeignKrw: number | null = null;
        
        // prices.json의 volume24hQuote 우선 사용, 없으면 marketStats 확인
        const foreignVolumeQuote = foreignEntry?.volume24hQuote ?? marketStats[foreignPriceKey]?.volume24hQuote;

        if (foreignVolumeQuote != null && foreignVolumeQuote > 0) {
          const vol = foreignVolumeQuote;

          if (foreignQuote === "USDT" && fxRate) {
            // USDT 마켓: USDT 거래대금 × 환율
            volume24hForeignKrw = vol * fxRate;
          } else if (foreignQuote === "BTC") {
            // BTC 마켓: BTC 거래대금 × BTC/USDT × 환율
            const btcPriceOrder = ["BINANCE:BTC:USDT", "OKX:BTC:USDT", "BITGET:BTC:USDT", "GATE:BTC:USDT", "MEXC:BTC:USDT"];
            let btcUsdtPrice = 0;
            for (const key of btcPriceOrder) {
              if (prices[key]?.price) {
                btcUsdtPrice = prices[key].price;
                break;
              }
            }
            if (btcUsdtPrice > 0) {
              volume24hForeignKrw = vol * btcUsdtPrice * fxRate;
            }
          } else {
            // 기타 (KRW 마켓 등): 그대로 사용
            volume24hForeignKrw = vol;
          }
        }

        const fromHighRate = (high24hKrw && domesticPriceKrw && high24hKrw > 0)
          ? ((domesticPriceKrw / high24hKrw) - 1) * 100
          : null;

        const highDiffKrw = (high24hKrw && domesticPriceKrw)
          ? high24hKrw - domesticPriceKrw
          : null;

        const fromLowRate = (low24hKrw && domesticPriceKrw && low24hKrw > 0)
          ? ((domesticPriceKrw / low24hKrw) - 1) * 100
          : null;

        const lowDiffKrw = (low24hKrw && domesticPriceKrw)
          ? domesticPriceKrw - low24hKrw
          : null;

        return {
          symbol,
          name_ko: market.name_ko || master?.name_ko || premiumRow?.name_ko || symbol,
          name_en: market.name_en || master?.name_en || premiumRow?.name_en || symbol,
          market: market.market,
          exchange: market.exchange,
          quote: market.quote,
          domesticExchange: domesticExchange,
          foreignExchange: foreignExchange,

          // ✨ 반올림 제거: 원본 값 그대로 전달 (프론트엔드에서 포맷)
          koreanPrice: domesticPriceKrw,
          foreignPriceKrw: foreignPriceKrw,

          premiumRate: premiumRate,
          premiumDiffKrw: premiumDiffKrw,

          changeRate: changeRate,
          changeAbsKrw: changeAbsKrw,

          fromHighRate: fromHighRate,
          highDiffKrw: highDiffKrw,

          fromLowRate: fromLowRate,
          lowDiffKrw: lowDiffKrw,

          volume24hKrw: volume24hKrw,
          volume24hForeignKrw: volume24hForeignKrw,

          high24h: high24hKrw,
          low24h: low24hKrw,

          globalPrice: foreignPrice,
          premium: premiumRate,
          isListed: (domesticPriceKrw && domesticPriceKrw > 0) && (foreignPrice && foreignPrice > 0),
          icon_url: iconUrl,
          displayName: market.name_ko || market.name_en || symbol,
          cmcSlug: cmcSlug,
        };
      })
      .filter((row) => row.koreanPrice || row.foreignPriceKrw)
      .sort((a, b) => {
        const aPremium = a.premium ?? -Infinity;
        const bPremium = b.premium ?? -Infinity;
        return bPremium - aPremium;
      });

    const premiumsWithValues = filtered.filter(r => r.premium !== null);
    const avgPremium = premiumsWithValues.length > 0
      ? premiumsWithValues.reduce((sum, r) => sum + (r.premium ?? 0), 0) / premiumsWithValues.length
      : 0;

    const selectedMarkets = allMarkets.filter((m) => {
      return m.exchange === domesticExchange && m.quote === domesticQuote;
    });
    const selectedUniqueSymbols = new Set(selectedMarkets.map(m => m.base.toUpperCase()));
    const totalCryptoCount = selectedUniqueSymbols.size;

    const responseData = {
      success: true,
      data: filtered,
      averagePremium: Math.round(avgPremium * 100) / 100,
      fxRate: fxRate,
      updatedAt: new Date().toISOString(),
      domesticExchange,
      foreignExchange,
      totalCoins: totalCryptoCount,
      listedCoins: filtered.filter(r => r.isListed).length,
      top20Symbols: Array.from(top20Set), // TOP 20 심볼 포함
    };

    // 메모리 캐시에 저장 (800ms TTL)
    setCache(cacheKey, responseData);

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("[API] /premium/table-filtered error:", err);
    return res.status(500).json({
      success: false,
      data: [],
      averagePremium: 0,
      fxRate: 1380,
      updatedAt: new Date().toISOString(),
      totalCoins: 0,
      listedCoins: 0,
    });
  }
}
