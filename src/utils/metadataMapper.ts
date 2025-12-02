export function normalizeSymbol(symbol: string): string {
  return symbol.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export interface CoinMetadata {
  base_symbol?: string;
  name_ko: string | null;
  name_en: string | null;
  icon_url: string | null;
}

export interface PremiumItem {
  symbol: string;
  koreanPrice: number;
  globalPriceKrw: number;
  premium: number;
  domesticExchange?: string;
  foreignExchange?: string;
  timestamp?: string;
  name_ko?: string;
  name_en?: string;
  icon_url?: string | null;
}

export function attachMetadata(
  item: any,
  metaMap: Record<string, CoinMetadata>
): PremiumItem {
  const symbol = normalizeSymbol(item.symbol || "");
  const meta = metaMap[symbol];

  return {
    symbol,
    koreanPrice: item.koreanPrice,
    globalPriceKrw: item.globalPriceKrw,
    premium: item.premium,
    domesticExchange: item.domesticExchange || "UPBIT",
    foreignExchange: item.foreignExchange || "OKX",
    timestamp: item.timestamp || new Date().toISOString(),
    name_ko: meta?.name_ko || symbol,
    name_en: meta?.name_en || symbol,
    icon_url: meta?.icon_url || null,
  };
}
