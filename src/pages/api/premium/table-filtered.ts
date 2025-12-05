import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

interface MarketStatsEntry {
  change24hRate: number;
  change24hAbs: number;
  high24h: number | null;
  low24h: number | null;
  volume24hQuote: number;
}

type MarketStatsMap = Record<string, MarketStatsEntry>;

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
    const prices = loadJsonFile("prices.json") as Record<string, { price: number; ts: number }>;
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

        let domesticPriceRaw = prices[domesticPriceKey]?.price ?? null;
        let domesticPriceKrw: number | null = null;
        
        // 국내 마켓 원화 환산 로직
        if (domesticPriceRaw && domesticPriceRaw > 0) {
          if (domesticQuote === "KRW") {
            // KRW 마켓: 이미 원화
            domesticPriceKrw = domesticPriceRaw;
          } else if (domesticQuote === "BTC") {
            // BTC 마켓: 코인 BTC가 × 같은 거래소 BTC/KRW
            const btcKrwKey = `${domesticExchange}:BTC:KRW`;
            const btcKrw = prices[btcKrwKey]?.price ?? 0;
            if (btcKrw > 0) {
              domesticPriceKrw = domesticPriceRaw * btcKrw;
            }
          } else if (domesticQuote === "USDT") {
            // USDT 마켓: 코인 USDT가 × 글로벌 테더 시세
            domesticPriceKrw = domesticPriceRaw * fxRate;
          }
        }
        
        const foreignPrice = prices[foreignPriceKey]?.price ?? null;

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

        const domesticStatsKey = `${domesticExchange}:${symbol}:${domesticQuote}`;
        const foreignStatsKey = `${foreignExchange}:${symbol}:${foreignQuote}`;
        
        const domesticStats = marketStats[domesticStatsKey];
        const foreignStats = marketStats[foreignStatsKey];

        const changeRate = domesticStats?.change24hRate ?? 0;
        
        // changeAbsKrw, high24h, low24h, volume24hQuote를 KRW로 변환
        let changeAbsKrw = domesticStats?.change24hAbs ?? 0;
        let high24hKrw: number | null = domesticStats?.high24h ?? null;
        let low24hKrw: number | null = domesticStats?.low24h ?? null;
        let volume24hKrw = domesticStats?.volume24hQuote ?? 0;

        // BTC/USDT 마켓의 경우 KRW 변환 필요
        if (domesticQuote === "BTC") {
          const btcKrwKey = `${domesticExchange}:BTC:KRW`;
          const btcKrw = prices[btcKrwKey]?.price ?? 0;
          if (btcKrw > 0) {
            changeAbsKrw = changeAbsKrw * btcKrw;
            if (high24hKrw) high24hKrw = high24hKrw * btcKrw;
            if (low24hKrw) low24hKrw = low24hKrw * btcKrw;
            volume24hKrw = volume24hKrw * btcKrw;
          } else {
            // BTC/KRW 가격 없으면 계산 불가
            changeAbsKrw = 0;
            high24hKrw = null;
            low24hKrw = null;
            volume24hKrw = 0;
          }
        } else if (domesticQuote === "USDT") {
          changeAbsKrw = changeAbsKrw * fxRate;
          if (high24hKrw) high24hKrw = high24hKrw * fxRate;
          if (low24hKrw) low24hKrw = low24hKrw * fxRate;
          volume24hKrw = volume24hKrw * fxRate;
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

        const foreignVolumeKrw = (foreignStats?.volume24hQuote != null)
          ? foreignStats.volume24hQuote * fxRate
          : 0;

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

          changeRate: Math.round(changeRate * 100) / 100,
          changeAbsKrw: Math.round(changeAbsKrw * 100) / 100,

          fromHighRate: fromHighRate !== null ? Math.round(fromHighRate * 100) / 100 : null,
          highDiffKrw: highDiffKrw !== null ? Math.round(highDiffKrw * 100) / 100 : null,

          fromLowRate: fromLowRate !== null ? Math.round(fromLowRate * 100) / 100 : null,
          lowDiffKrw: lowDiffKrw !== null ? Math.round(lowDiffKrw * 100) / 100 : null,

          volume24hKrw,
          volume24hForeignKrw: Math.round(foreignVolumeKrw * 100) / 100,

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

    // totalCoins는 선택된 마켓(domesticQuote)의 실제 고유 심볼 수
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
