export function normalizeSymbol(symbol: string) {
  return symbol.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function attachMetadata(item: any, meta: any) {
  const sym = normalizeSymbol(item.symbol || "");
  const m = meta[sym] || {};

  return {
    symbol: sym,
    nameKo: m.name_ko || null,
    nameEn: m.name_en || null,
    iconUrl: m.icon_url || null,
    displayName: m.name_ko || m.name_en || sym,
    koreanPrice: item.koreanPrice ?? 0,
    globalPrice: item.globalPrice ?? null,
    globalPriceKrw: item.globalPriceKrw ?? 0,
    premium: typeof item.premium === "number" ? item.premium : 0,
    domesticExchange: item.domesticExchange || null,
    foreignExchange: item.foreignExchange || null,
  };
}
