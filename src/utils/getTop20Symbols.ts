/**
 * 거래대금 TOP 20 심볼 추출
 */
export function getTop20Symbols(stats: Record<string, any>): string[] {
  if (!stats || typeof stats !== 'object') return [];

  // marketStats는 Record<symbol, stats> 형태
  const entries = Object.entries(stats)
    .map(([symbol, stat]: [string, any]) => ({
      symbol,
      volume24hKrw: stat?.volume24hQuote ?? 0,
    }))
    .sort((a, b) => b.volume24hKrw - a.volume24hKrw)
    .slice(0, 20);

  return entries.map((e) => e.symbol);
}
