# 비활성화 스크립트 목록

다음 스크립트들은 데이터 정리 이후 더 이상 사용되지 않습니다:

## 비활성화 이유
- 기존: 여러 소스의 데이터를 머지/파싱하는 복잡한 로직
- 신규: 거래소 원본 데이터만 직접 Supabase에 저장 (단방향)

## 비활성화 목록
1. `scripts/mergeExchangeMetadata.ts` - 메타데이터 머지 로직 (이제 불필요)
2. `scripts/syncMarkets.ts` - 복잡한 마켓 동기화 (새 스크립트로 대체)
3. `scripts/syncDomesticMarkets.ts` - 국내 마켓 커스텀 로직 (새 스크립트로 대체)
4. `scripts/initializeExchangeMarkets.ts` - 초기화 스크립트 (일회용)
5. `scripts/exportMetadata.ts` - 메타데이터 내보내기 (이제 불필요)

## 새로운 스크립트 (활성화)
1. `scripts/syncUpbitMarkets.ts` - 업비트 마켓 직접 동기화
2. `scripts/syncBithumbMarkets.ts` - 빗썸 마켓 직접 동기화
3. `scripts/syncCoinoneMarkets.ts` - 코인원 마켓 직접 동기화

## 실행 순서
```bash
npx tsx scripts/syncUpbitMarkets.ts
npx tsx scripts/syncBithumbMarkets.ts
npx tsx scripts/syncCoinoneMarkets.ts
```
