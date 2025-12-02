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
  const base = symbol.split('/')[0].toLowerCase();

  // 1순위: cmcSlug 사용
  // 2순위: 심볼 소문자
  const slug = cmcSlug && cmcSlug.trim().length > 0 
    ? cmcSlug.trim() 
    : base;

  return `https://coinmarketcap.com/currencies/${slug}/`;
}

/**
 * CMC 페이지를 새 탭에서 오픈
 * @param symbol - 코인 심볼
 * @param cmcSlug - CoinMarketCap slug (선택)
 */
export function openCmcPage(symbol: string, cmcSlug?: string): void {
  const url = getCmcUrl(symbol, cmcSlug);
  window.open(url, '_blank', 'noopener,noreferrer');
}
