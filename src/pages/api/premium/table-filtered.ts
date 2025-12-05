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

type PricesMap = Record<string, PriceEntry>;

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

        let volume24hKrw: number | null = null;
        const domesticVolume = domesticEntry?.volume24hKrw;

        if (domesticQuote === "KRW") {
          volume24hKrw = domesticVolume ?? null;
        } else if (domesticQuote === "USDT") {
          if (domesticVolume != null) {
            volume24hKrw = domesticVolume * fxRate;
          }
          if (changeAbsKrw != null) changeAbsKrw = changeAbsKrw * fxRate;
          if (high24hKrw != null) high24hKrw = high24hKrw * fxRate;
          if (low24hKrw != null) low24hKrw = low24hKrw * fxRate;
        } else if (domesticQuote === "BTC") {
          if (btcKrw > 0) {
            if (domesticVolume != null) {
              volume24hKrw = domesticVolume * btcKrw;
            }
            if (changeAbsKrw != null) changeAbsKrw = changeAbsKrw * btcKrw;
            if (high24hKrw != null) high24hKrw = high24hKrw * btcKrw;
            if (low24hKrw != null) low24hKrw = low24hKrw * btcKrw;
          } else {
            volume24hKrw = null;
            changeAbsKrw = null;
            high24hKrw = null;
            low24hKrw = null;
          }
        }

        let volume24hForeignKrw: number | null = null;
        const foreignVolume = foreignEntry?.volume24hKrw ?? foreignEntry?.volume24hQuote;

        if (foreignQuote === "USDT") {
          if (foreignVolume != null) {
            volume24hForeignKrw = foreignVolume * fxRate;
          }
        } else if (foreignQuote === "BTC") {
          const btcPriceOrder = ["BINANCE:BTC:USDT", "OKX:BTC:USDT", "BITGET:BTC:USDT", "GATE:BTC:USDT", "MEXC:BTC:USDT"];
          let btcUsdtPrice = 0;
          for (const key of btcPriceOrder) {
            if (prices[key]?.price) {
              btcUsdtPrice = prices[key].price;
              break;
            }
          }
          if (foreignVolume != null && btcUsdtPrice > 0) {
            volume24hForeignKrw = foreignVolume * btcUsdtPrice * fxRate;
          }
        } else {
          volume24hForeignKrw = foreignVolume ?? null;
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
