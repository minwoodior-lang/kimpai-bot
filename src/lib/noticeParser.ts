/**
 * 빗썸/코인원 상장 공지 크롤러
 * 공식 상장 공지에서 "한글명 / 심볼" 정보 추출
 */

// 브라우저에서 실행되지 않도록 가드
if (typeof window !== 'undefined') {
  throw new Error('[NoticeParser] This module should only run in Node.js/server context');
}

interface CoinNoticeData {
  symbol: string;
  koName: string;
  source: 'bithumb' | 'coinone';
}

/**
 * 정규식 패턴으로 "심볼(한글명)" 또는 "한글명(심볼)" 형태 파싱
 */
function parseSymbolAndName(text: string): { symbol?: string; koName?: string } {
  // 패턴 1: 영문(한글) - "PIEVERSE(파이버스)" 또는 "PIEVERSE（파이버스）"
  const pattern1 = /([A-Z0-9]{2,})\s*[\(（]([가-힣0-9\s·\-\+]+)[\)）]/;
  const match1 = text.match(pattern1);
  if (match1) {
    return {
      symbol: match1[1].trim().toUpperCase(),
      koName: match1[2].trim(),
    };
  }

  // 패턴 2: 한글(영문) - "파이버스(PIEVERSE)" 또는 "파이버스（PIEVERSE）"
  const pattern2 = /([가-힣0-9\s·\-\+]+)\s*[\(（]([A-Z0-9]{2,})[\)）]/;
  const match2 = text.match(pattern2);
  if (match2) {
    return {
      symbol: match2[2].trim().toUpperCase(),
      koName: match2[1].trim(),
    };
  }

  return {};
}

/**
 * 빗썸 상장 공지 크롤링
 * URL: https://cafe.bithumb.com/view/board-type/annc/article-category/general/page/1
 */
export async function crawlBithumbNotices(): Promise<CoinNoticeData[]> {
  const results: CoinNoticeData[] = [];

  try {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://cafe.bithumb.com/view/board-type/annc/article-category/general/page/${page}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });

        if (!response.ok) break;

        const html = await response.text();
        const titleMatches = html.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/a>/gi) || [];

        for (const match of titleMatches) {
          try {
            const titleText = match.replace(/<[^>]*>/g, '').trim();
            if (!/상장|listing/i.test(titleText)) continue;

            const { symbol, koName } = parseSymbolAndName(titleText);
            if (symbol && koName && symbol.length >= 2 && koName.length >= 2) {
              results.push({ symbol, koName, source: 'bithumb' });
            }
          } catch (matchError) {
            // Skip individual match errors
            continue;
          }
        }
      } catch (pageError) {
        console.error(`[Bithumb] Page ${page} error:`, pageError instanceof Error ? pageError.message : String(pageError));
        continue;
      }
    }
  } catch (error) {
    console.error('[Bithumb] Crawl error:', error instanceof Error ? error.message : String(error));
  }

  return results;
}

/**
 * 코인원 상장 공지 크롤링
 * URL: https://coinone.co.kr/info/notice?category=LISTING
 */
export async function crawlCoinoneNotices(): Promise<CoinNoticeData[]> {
  const results: CoinNoticeData[] = [];

  try {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://coinone.co.kr/info/notice?category=LISTING&page=${page}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });

        if (!response.ok) break;

        const html = await response.text();
        const titleMatches = html.match(/<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi) || [];

        for (const match of titleMatches) {
          try {
            const titleText = match.replace(/<[^>]*>/g, '').trim();
            if (!/상장|listing/i.test(titleText)) continue;

            const { symbol, koName } = parseSymbolAndName(titleText);
            if (symbol && koName && symbol.length >= 2 && koName.length >= 2) {
              results.push({ symbol, koName, source: 'coinone' });
            }
          } catch (matchError) {
            continue;
          }
        }
      } catch (pageError) {
        console.error(`[Coinone] Page ${page} error:`, pageError instanceof Error ? pageError.message : String(pageError));
        continue;
      }
    }
  } catch (error) {
    console.error('[Coinone] Crawl error:', error instanceof Error ? error.message : String(error));
  }

  return results;
}

/**
 * 모든 상장 공지에서 데이터 추출 (빗썸 + 코인원)
 */
export async function crawlAllNotices(): Promise<CoinNoticeData[]> {
  try {
    const [bithumbData, coinoneData] = await Promise.all([
      crawlBithumbNotices(),
      crawlCoinoneNotices(),
    ]);

    // 중복 제거 (symbol 기준)
    const symbolSet = new Set<string>();
    const uniqueResults = [...bithumbData, ...coinoneData].filter((item) => {
      if (symbolSet.has(item.symbol)) return false;
      symbolSet.add(item.symbol);
      return true;
    });

    console.log(
      `[NoticeParser] Crawled ${uniqueResults.length} unique coins from notices`,
      `(Bithumb: ${bithumbData.length}, Coinone: ${coinoneData.length})`
    );

    return uniqueResults;
  } catch (error) {
    console.error('[NoticeParser] Error:', error);
    return [];
  }
}
