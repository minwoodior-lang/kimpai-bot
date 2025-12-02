/**
 * 빗썸/코인원 상장 공지 자동 크롤러
 * 1시간마다 실행되어 master_symbols 최신화
 * 
 * ⚠️ 환경 변수:
 * - NOTICE_CRAWLER_ENABLED=true (기본값) → 크롤링 수행
 * - NOTICE_CRAWLER_ENABLED=false → no-op (Replit 같은 제한 환경용)
 */

import { crawlAllNotices } from '../src/lib/noticeParser';
import { batchUpsertKoreanNames, countMasterSymbolsWithKoName } from '../src/lib/updateMasterSymbols';

async function runNoticeUpdateWorker() {
  console.log('[NoticeUpdateWorker] Starting...');

  // 환경 변수 기반 크롤러 활성화 여부 (기본: true)
  const crawlerEnabled = process.env.NOTICE_CRAWLER_ENABLED !== 'false';
  
  if (!crawlerEnabled) {
    console.log('[NoticeUpdateWorker] Disabled (NOTICE_CRAWLER_ENABLED=false). Skipping.');
    return;
  }

  try {
    // 초기 카운트
    const initialCount = await countMasterSymbolsWithKoName();
    console.log(`[NoticeUpdateWorker] Initial ko_name count: ${initialCount}`);

    // 상장 공지 크롤링
    const noticeData = await crawlAllNotices();

    if (noticeData.length === 0) {
      console.log('[NoticeUpdateWorker] No new coins found in notices');
      return;
    }

    console.log(`[NoticeUpdateWorker] Found ${noticeData.length} coins from notices`);

    // master_symbols 업데이트
    const result = await batchUpsertKoreanNames(
      noticeData.map((item) => ({
        symbol: item.symbol,
        koName: item.koName,
      }))
    );

    // 최종 카운트
    const finalCount = await countMasterSymbolsWithKoName();
    console.log(
      `[NoticeUpdateWorker] Complete: ${result.success} added, ${result.failed} failed`
    );
    console.log(`[NoticeUpdateWorker] Final ko_name count: ${finalCount}`);
  } catch (error) {
    // 크롤러 실패 시 조용히 로깅하고 프로세스는 계속 진행
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[NoticeUpdateWorker] Error (non-fatal):', errorMsg);
    // process.exit(1) 제거 - 실패해도 프로세스 유지
  }
}

// 메인 실행
runNoticeUpdateWorker().then(() => {
  console.log('[NoticeUpdateWorker] Finished');
  process.exit(0);
}).catch((err) => {
  console.error('[NoticeUpdateWorker] Unexpected error:', err);
  // 실패해도 graceful exit
  process.exit(0);
});
