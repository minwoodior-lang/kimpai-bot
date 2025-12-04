/**
 * CoinMarketCap 링크 생성 유틸
 * cmcSlug 기반 정확한 URL 생성 및 오픈
 */

/**
 * CMC 상세 페이지 URL 생성
 * @param symbol - 코인 심볼 (BTC, ETH 등)
 * @param cmcSlug - CoinMarketCap slug (bitcoin, ethereum 등)
 * @returns CMC 상세 페이지 URL
 */
export function getCmcUrl(symbol: string, cmcSlug?: string): string {
  let url: string;

  if (cmcSlug && cmcSlug.trim().length > 0) {
    url = `https://coinmarketcap.com/ko/currencies/${cmcSlug}/?utm_source=apiswap&utm_medium=web&utm_campaign=kimpga`;
  } else {
    const query = encodeURIComponent(symbol.toLowerCase());
    url = `https://coinmarketcap.com/ko/search/?q=${query}`;
  }

  return url;
}

/**
 * CMC 페이지를 새 탭에서 오픈
 * @param symbol - 코인 심볼
 * @param cmcSlug - CoinMarketCap slug (선택)
 */
export function openCmcPage(symbol: string, cmcSlug?: string): void {
  if (typeof window !== "undefined") {
    const url = getCmcUrl(symbol, cmcSlug);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
