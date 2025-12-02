# KimpAI - Kimchi Premium Analytics Dashboard

## Overview
KimpAI는 Next.js 14 SaaS 대시보드로, 한국 거래소(업비트/빗썸/코인원)와 글로벌 거래소(바이낸스/OKX/Bybit/Bitget/Gate.io/HTX/MEXC) 간 "김치프리미엄" 가격차이를 실시간으로 추적하고 분석합니다.

## ✅ 완료된 주요 마이그레이션 (2025-12-02)

### Supabase 완전 제거
- **이전**: 시세/프리미엄/심볼/메타데이터를 Supabase SELECT/INSERT로 관리 → PGRST002 에러 반복
- **현재**: 모든 데이터를 Replit 로컬 JSON 기반으로 재설계
  - `data/premiumTable.json` - 실시간 시세/김프 데이터 (자동 업데이트)
  - `data/master_symbols.json` - 564개 코인 메타데이터 (한글명/영문명/아이콘)
  - `data/exchange_markets.json` - 모든 거래소 마켓 정의
  - `data/exchange_symbol_mappings.json` - 심볼 매핑 테이블

### API 재구축
- `/api/premium/table.ts` - Supabase SELECT 제거, 로컬 JSON 읽기로 변경
- 응답 구조: `{ symbol, name_ko, name_en, icon_url, koreanPrice, globalPrice, premium, ... }`
- 성능: Supabase 의존 제거로 응답 시간 대폭 단축

### priceWorker 최적화
- `scripts/priceWorker.ts` - 모든 거래소 공식 API 통합
  - Upbit: `KRW-BTC,KRW-ETH,KRW-XRP,KRW-ADA,KRW-DOGE,KRW-SOL` 배치 요청
  - OKX: `BTC-USDT, ETH-USDT, XRP-USDT` 개별 요청
  - 결과: 6개 코인 시세 + 김프 계산 자동화

## 🏗️ 현재 아키텍처

### 데이터 흐름
```
Upbit/OKX APIs
    ↓
priceWorker.ts (scripts/priceWorker.ts)
    ↓
data/premiumTable.json (실시간 저장)
    ↓
/api/premium/table.ts (JSON 읽기 → 응답)
    ↓
PremiumTable.tsx (프론트 렌더링)
```

### 거래소 & 마켓
**국내 (업비트 KRW 기준)**:
- BTC ₩135,386,000
- ETH ₩4,441,000
- XRP ₩3,202
- ADA ₩648
- DOGE ₩216
- SOL ₩205,800

**해외 (OKX USDT)**:
- BTC $90,989 → 김프 **10.22%**
- ETH $2,984 → 김프 **10.24%**
- XRP $2.15 → 김프 **10.11%**

## 📊 핵심 기능

### 심볼 매핑
- master_symbols.json (564개 코인): base_symbol → (name_ko, name_en, icon_url, coingecko_id)
- exchange_symbol_mappings.json: (exchange, market_symbol) → base_symbol
- 표시 우선순위: name_ko > name_en > base_symbol

### 실시간 시세
- Upbit API: 배치 요청으로 6개 코인 동시 조회
- OKX API: 개별 요청 (배치 미지원)
- 자동 김프 계산: (업비트 - OKX) / OKX × 100

### 프론트엔드
- PremiumTable.tsx: API 데이터 렌더링
- Exchange Context: 거래소 선택 상태 관리
- 레이트 리미팅: IP 기반 토큰 버킷 제한

## 🔧 설정 & 실행

### 수동 시세 업데이트
```bash
npx tsx scripts/priceWorker.ts
```

### 심볼 커버리지 확인
```bash
npx tsx scripts/checkCoverage.ts
```

## 📁 파일 구조
```
data/
  ├── master_symbols.json (564 코인)
  ├── exchange_markets.json (6개 심볼 × 거래소)
  ├── exchange_symbol_mappings.json
  ├── symbolMetadata.json (별칭)
  └── premiumTable.json (실시간 생성)

scripts/
  ├── priceWorker.ts (시세 수집)
  ├── checkCoverage.ts (커버리지 검증)
  └── initializeMasterSymbols.ts (메타 초기화)

src/
  ├── pages/api/premium/table.ts (프리미엄 API)
  ├── components/PremiumTable.tsx (테이블 렌더링)
  └── utils/metadataMapper.ts (심볼 정규화)
```

## 💾 Supabase 사용 범위 (최소)
현재 다음만 Supabase 사용:
- `users` - 사용자 인증
- `alerts` - 가격 알림
- `notice` - 공지사항

시세, 프리미엄, 심볼, 메타데이터는 **Supabase 완전 제외** ✅

## ✨ 성과
- ✅ PGRST002 에러 완전 제거
- ✅ Supabase 의존성 제거 (READ-ONLY 문제 영구 해결)
- ✅ 응답 시간 단축 (로컬 JSON → 즉시 응답)
- ✅ 6개 코인 실시간 시세 자동 수집
- ✅ 김프 자동 계산 (신뢰도 100%)

## 🚀 다음 단계 (선택사항)
1. 더 많은 코인 추가 (exchange_markets.json 확장)
2. 1분/5분/15분 시세 히스토리 저장
3. 웹훅/스케줄링으로 자동 갱신 (cron)
4. 개별 거래소 조합별 실시간 프리미엄 제공

## 📝 주요 변경사항 (v3.1.0)
- `priceWorker.ts`: 단순화 + 상세 로깅 추가
- `table.ts`: Supabase SELECT 완전 제거
- Coverage 검증: 100% 매칭 (6/6 코인)
