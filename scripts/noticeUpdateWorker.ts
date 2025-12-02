/**
 * 빗썸/코인원 상장 공지 자동 크롤러
 * 1시간마다 실행되어 master_symbols 최신화
 */

import { crawlAllNotices } from '../src/lib/noticeParser';
import { batchUpsertKoreanNames, countMasterSymbolsWithKoName } from '../src/lib/updateMasterSymbols';

async function runNoticeUpdateWorker() {
  console.log('[NoticeUpdateWorker] Starting...');

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
    console.error('[NoticeUpdateWorker] Error:', error);
    process.exit(1);
  }
}

// 메인 실행
runNoticeUpdateWorker().then(() => {
  console.log('[NoticeUpdateWorker] Finished');
  process.exit(0);
});
