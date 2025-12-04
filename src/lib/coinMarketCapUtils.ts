/**
 * CoinMarketCap 링크 생성 유틸
 * cmcSlug 기반 정확한 URL 생성 및 오픈
 */

/**
 * CMC 페이지를 새 탭에서 오픈
 * @param symbol - 코인 심볼
 * @param cmcSlug - CoinMarketCap slug (선택)
 */
export function openCmcPage(symbol: string, cmcSlug?: string) {
  // 1) slug가 있으면 currencies/{slug}/ 로 이동
  if (cmcSlug && cmcSlug.trim().length > 0) {
    const slug = cmcSlug.trim().toLowerCase();
    const url = `https://coinmarketcap.com/ko/currencies/${slug}/?utm_source=kimpai&utm_medium=web&utm_campaign=premium-table`;
    console.log("[CMC_URL] Using slug:", slug, "→", url);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return;
  }

  // 2) slug가 없을 때만 검색 페이지로 폴백
  const baseSymbol = symbol.replace(/\/[A-Z]+$/i, "").toLowerCase();
  const url = `https://coinmarketcap.com/ko/search/?q=${encodeURIComponent(baseSymbol)}`;
  console.log("[CMC_URL] No slug, fallback to search:", baseSymbol, "→", url);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * CMC 상세 페이지 URL 생성 (getCmcUrl 유틸)
 * @param symbol - 코인 심볼 (BTC, ETH 등)
 * @param cmcSlug - CoinMarketCap slug (bitcoin, ethereum 등)
 * @returns CMC 상세 페이지 URL
 */
export function getCmcUrl(symbol: string, cmcSlug?: string): string {
  if (cmcSlug && cmcSlug.trim().length > 0) {
    const slug = cmcSlug.trim().toLowerCase();
    return `https://coinmarketcap.com/ko/currencies/${slug}/?utm_source=kimpai&utm_medium=web&utm_campaign=premium-table`;
  }
  const baseSymbol = symbol.replace(/\/[A-Z]+$/i, "").toLowerCase();
  return `https://coinmarketcap.com/ko/search/?q=${encodeURIComponent(baseSymbol)}`;
}
