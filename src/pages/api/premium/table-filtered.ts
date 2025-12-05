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

function loadJsonFile(filename: string): any {
  try {
    const file = path.join(process.cwd(), "data", filename);
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return filename.endsWith('.json') ? [] : {};
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { domestic = "UPBIT_KRW", foreign = "BINANCE_USDT" } = req.query;

    const domesticParts = (domestic as string).split("_");
    const domesticExchange = domesticParts[0];
    const domesticQuote = domesticParts.slice(1).join("_");

    const foreignParts = (foreign as string).split("_");
    const foreignExchange = foreignParts[0];
    const foreignQuote = foreignParts.slice(1).join("_");

    const allMarkets = loadJsonFile("exchange_markets.json") as any[];
    const masterSymbols = loadJsonFile("master_symbols.json") as any[];
    const premiumTable = loadJsonFile("premiumTable.json") as any[];
    const prices = loadJsonFile("prices.json") as PricesMap;
    const marketStats = loadJsonFile("marketStats.json") as MarketStatsMap;

    const masterMap = new Map(masterSymbols.map((s: any) => [s.symbol, s]));
    const premiumMap = new Map(premiumTable.map((p: any) => [p.symbol, p]));

    const fxRate = premiumTable[0]?.usdKrw || 1380;

    const filtered = allMarkets
      .filter((m) => {
        const matchExchange = m.exchange === domesticExchange;
        const matchQuote = m.quote === domesticQuote;
        return matchExchange && matchQuote;
      })
      .map((market) => {
        const symbol = market.base.toUpperCase();
        const master = masterMap.get(symbol);
        const premiumRow = premiumMap.get(symbol);

        const domesticPriceKey = `${domesticExchange}:${symbol}:${domesticQuote}`;
        const foreignPriceKey = `${foreignExchange}:${symbol}:${foreignQuote}`;

        const domesticEntry = prices[domesticPriceKey];
        const foreignEntry = prices[foreignPriceKey];

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

          koreanPrice: domesticPriceKrw,
          foreignPriceKrw: foreignPriceKrw ? Math.round(foreignPriceKrw * 100) / 100 : null,

          premiumRate: premiumRate ? Math.round(premiumRate * 100) / 100 : null,
          premiumDiffKrw: premiumDiffKrw ? Math.round(premiumDiffKrw * 100) / 100 : null,

          changeRate: changeRate != null ? Math.round(changeRate * 100) / 100 : null,
          changeAbsKrw: changeAbsKrw != null ? Math.round(changeAbsKrw * 100) / 100 : null,

          fromHighRate: fromHighRate !== null ? Math.round(fromHighRate * 100) / 100 : null,
          highDiffKrw: highDiffKrw !== null ? Math.round(highDiffKrw * 100) / 100 : null,

          fromLowRate: fromLowRate !== null ? Math.round(fromLowRate * 100) / 100 : null,
          lowDiffKrw: lowDiffKrw !== null ? Math.round(lowDiffKrw * 100) / 100 : null,

          volume24hKrw: volume24hKrw,
          volume24hForeignKrw: volume24hForeignKrw,

          high24h: high24hKrw,
          low24h: low24hKrw,

          globalPrice: foreignPrice,
          premium: premiumRate ? Math.round(premiumRate * 100) / 100 : null,
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

    return res.status(200).json({
      success: true,
      data: filtered,
      averagePremium: Math.round(avgPremium * 100) / 100,
      fxRate: fxRate,
      updatedAt: new Date().toISOString(),
      domesticExchange,
      foreignExchange,
      totalCoins: totalCryptoCount,
      listedCoins: filtered.filter(r => r.isListed).length,
    });
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
