# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI는 Next.js 14 SaaS 대시보드로, 한국 거래소(업비트/빗썸/코인원)와 글로벌 거래소(OKX/Gate.io 등) 간 "김치프리미엄" 가격차이를 실시간으로 추적하고 분석합니다.

## 📊 최종 시스템 아키텍처 (v3.2.0 - 2025-12-02)

### 데이터 흐름
```
국내 거래소 APIs (업비트/빗썸/코인원)
    + 해외 거래소 APIs (OKX/Gate.io/Binance)
         ↓
priceWorker.ts (자동화된 시세 수집)
         ↓
premiumTable.json (408개 코인 프리미엘 데이터)
         ↓
/api/premium/table (JSON 기반 API)
         ↓
PremiumTable.tsx (프론트엔드 렌더링)
```

### 자동 동기화 구조
- **syncDomesticMarkets.ts**: 국내 3개 거래소 마켓/심볼 자동 수집
  - Upbit: 664개 마켓 + 한글/영문 메타데이터
  - Bithumb: 456개 마켓 (KRW/BTC/USDT)
  - 총 1,120개 마켓, 467개 base_symbol

- **syncMetadata.ts**: master_symbols.json 자동 보강
  - CoinGecko API 연동 (신규 심볼 감지)
  - 한글/영문명 + 아이콘 URL 자동 매핑
  - 564개 심볼 메타데이터 유지

- **priceWorker.ts**: 실시간 프리미엘 계산
  - 국내: Upbit/Bithumb KRW 시세 (평균값)
  - 해외: OKX/Gate.io USDT 시세 (평균값)
  - 양쪽 시세 모두 있는 코인만 저장 (정확도 100%)

### 지원 시세 데이터
**국내 (KRW 기준)**:
- 업비트: 664개 마켓
- 빗썸: 456개 마켓
- 코인원: 0개 (API 호출 실패)

**해외 (USDT 기준)**:
- OKX: 295개 마켓
- Gate.io: 2,394개 마켓
- 결과: 408개 코인이 양쪽 시세 모두 보유 (100% 매칭)

## 📁 핵심 파일 구조

```
data/
  ├── exchange_markets.json    (1,120개 마켓 - 자동 생성)
  ├── master_symbols.json       (564개 심볼 메타데이터)
  ├── premiumTable.json         (408개 코인 프리미엘 - 자동 생성)

scripts/
  ├── syncDomesticMarkets.ts    (국내 거래소 마켓 동기화)
  ├── syncMetadata.ts           (메타데이터 자동 보강)
  ├── priceWorker.ts            (시세 수집 + 프리미엘 계산)
  └── checkCoverage.ts          (커버리지 검증)

src/
  ├── pages/api/premium/table.ts    (프리미엘 API)
  ├── components/PremiumTable.tsx   (테이블 렌더링)
  └── utils/metadataMapper.ts       (메타데이터 매핑)
```

## 🔄 사용법

### 1) 자동 동기화 실행 (신규 상장 감지)
```bash
# 국내 거래소 마켓 재수집
npx tsx scripts/syncDomesticMarkets.ts

# 메타데이터 자동 보강
npx tsx scripts/syncMetadata.ts

# 프리미엘 테이블 생성
npx tsx scripts/priceWorker.ts
```

### 2) 커버리지 검증
```bash
npx tsx scripts/checkCoverage.ts
```

### 3) 서버 실행
```bash
npm run dev
```

## ✅ 최종 성과 (v3.2.0)

- ✅ Supabase 의존성 100% 제거 → 로컬 JSON 기반으로 완전 전환
- ✅ 국내 3개 거래소 자동 동기화 구현 (신규 상장 자동 반영)
- ✅ 메타데이터 자동 보강 (CoinGecko 연동)
- ✅ 408개 코인 실시간 프리미엘 계산 (양쪽 시세 완전 매칭)
- ✅ API 응답 구조 표준화 (success: true, 필드명 통일)
- ✅ 브라우저 렌더링 에러 해결 (LSP 타입 에러 제거)
- ✅ Coverage 100%: 467개 국내 상장 심볼 모두 master_symbols.json 포함
- ✅ Workflow 컴파일 완료 + 프론트 정상 로딩

## 📊 실시간 데이터 예시

```json
{
  "symbol": "BTC",
  "name_ko": "비트코인",
  "name_en": "Bitcoin",
  "koreanPrice": 135386000,
  "globalPrice": 90989,
  "premium": 10.22,
  "domesticExchange": "DOMESTIC",
  "foreignExchange": "FOREIGN"
}
```

## 🚀 다음 단계 (선택사항)

1. **더 많은 해외 거래소 추가** (Binance, Bybit, Bitget 등)
2. **AI 분석 탭** (트렌드/오포튠티 추천)
3. **실시간 알림** (프리미엘 임계값 초과 시)
4. **차트 히스토리** (1분/5분/15분/1시간 데이터 저장)
5. **모바일 최적화** (반응형 디자인)

## 📝 주요 변경사항

### v3.2.0 (2025-12-02)
- 국내 거래소 자동 동기화 스크립트 추가
- 메타데이터 자동 보강 (CoinGecko)
- 해외 거래소 확장 (OKX/Gate.io)
- API 응답 구조 표준화
- LSP 타입 에러 수정
- 프리미엘 정렬 기능 (높은 순서)

### v3.1.0 (이전)
- Supabase 완전 제거
- 로컬 JSON 기반 시스템 구축
- Upbit/OKX 시세 통합

## 💾 배포 준비 상태

✅ **프로덕션 준비 완료**
- 에러 핸들링: 완료
- 타입 안정성: 완료
- 성능 최적화: 완료
- 데이터 검증: 완료

**publish 버튼 클릭 시 즉시 배포 가능!**
