# KimpAI v3.4.29 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

---

## 🔒 CRITICAL: FIXED COMPONENTS (절대 수정 금지)

**v3.4.29에서 가격 파이프라인이 최적 성능에 도달했으므로 아래 항목은 절대 수정/리팩터링/최적화 시도 금지**

### ❌ 절대 수정 금지 파일 및 로직:

**1. 가격 파이프라인 전체 구조 (FROZEN)**
```
workers/websocket/**              ← WebSocket 연결 관리
workers/priceWorker.ts            ← 300ms 주기 고정
  - dirtyPriceKeys 기반 병합 로직
  - mergeWebSocketPrices()
  - updatePricesOnly()
data/prices.json 생성 구조        ← tmp → atomic write
src/pages/api/premium/table.ts
src/pages/api/premium/table-filtered.ts
  - API 캐싱 정책 (200~800ms)
  - 가격 참조 방식
```

**2. 국내 가격 수집 (최고 성능 유지)**
- 업비트/Bithumb/코인원 KRW 가격: **300ms 주기 유지**
- REST → prices.json → API 동일 구조
- 타임스탬프 비교 로직 유지
- 국내 가격 수집 로직 안정 버전 고정

**3. 절대 변경 금지 파라미터:**
```javascript
priceWorker interval: 300ms       ← 절대 변경 금지
API 캐시 TTL: 200~800ms          ← 절대 변경 금지
WebSocket 병합 기준               ← 절대 변경 금지
prices.json 구조                  ← 절대 변경 금지
premium 계산 방식                 ← 절대 변경 금지
marketStats.json 흐름            ← 절대 변경 금지
```

**⚠️ 위 항목 변경 시 발생하는 문제:**
- 실시간성 깨짐 (1-3초 latency → 5-10초)
- 정확도 저하 (WebSocket 가격 손실)
- 김프 UI 깜빡임 발생
- 가격 개수 급감 (4400+ → 1500)

**✅ 개발 가능 영역:**
- 홈 UX / 개인화 설정
- 알림 기능
- AI 분석
- 채팅 기능
- 기타 프론트엔드 기능

**📌 변경 필요 시:**
반드시 사용자와 사전 협의 후 진행

---

### Recent Changes (v3.4.29 - 2024-12-07) - WebSocket 실시간 가격 업데이트 완성 🎉

**✅ 프론트엔드 폴링 주기 최적화 (국내 시세 체감 딜레이 감소):**

1. ✅ **PremiumTable 폴링 주기 조정**
   - src/components/PremiumTable.tsx: 국내 거래소(KRW 마켓) 폴링 주기 1000ms → 800ms
   - 조건: domesticExchange.includes('_KRW') 체크
   - 효과: 국내 시세 체감 딜레이 약 0.2초 감소
   - 백엔드 가격 파이프라인은 변경 없음 (고정)

2. ✅ **TwoLinePriceCell 소수점 포맷 개선 (formatKrwDynamic - 김프가 동일 방식)**
   - src/components/TwoLinePriceCell.tsx: 동적 소수점 자리수 규칙 + 끝 0 제거
   - **동적 소수점 규칙 (김프가와 동일):**
     - abs >= 1000 → 소수 0자리 (정수 표시 + 천단위 콤마)
     - abs >= 1 → 소수 2자리
     - abs >= 0.1 → 소수 3자리
     - abs >= 0.01 → 소수 4자리
     - abs >= 0.001 → 소수 5자리
     - 그 미만 → 소수 6자리 (최대)
   - **끝 0 자동 제거 (NEW):**
     - `0.010000` → `0.01`
     - `0.00056000` → `0.00056`
     - `42.000` → `42`
     - 정규식 `.replace(/\.?0+$/, "")` 적용
   - **중요:** 0은 더 이상 "-"로 표시하지 않음 (실제 데이터로 간주)
     - null/undefined/NaN만 "-"로 표시
     - 0 값도 "+₩0" 또는 "₩0" 형태로 정상 표시
   - **signed 옵션:**
     - signed: false (기본값) → "₩1,234.56" (일반 가격)
     - signed: true → "+₩1,234.56" 또는 "-₩1,234.56" (차액/김프 차액)
   - **적용 대상:**
     - koreanPrice, foreignPriceKrw: formatKrwDynamic(value) [signed: false]
     - premiumDiffKrw, changeAbsKrw, highDiffKrw, lowDiffKrw: formatKrwDynamic(value, { signed: true/false })
   - 백엔드 raw 값은 변경 없음 (표시만 조정)

3. ✅ **PremiumTableRow 차액 계산 로직 프론트엔드 재계산 (API 0 값 문제 해결)**
   - **문제:** API에서 row.premiumDiffKrw, row.changeAbsKrw, row.highDiffKrw, row.lowDiffKrw가 0으로 내려와 화면에 ₩0.00000000으로 잘못 표시
   - **해결:** PremiumTableRow 내부에서 김프가 공식으로 차액 재계산 (백엔드 미수정)
   - **계산 로직:**
     - `premiumDiffKrw = koreanPrice - foreignPriceKrw` (김프 차액)
     - `changeAbsKrw = koreanPrice - prevClose` (전일대비 차액, changeRate/change24h로 prevClose 역산)
     - `highDiffKrw = high24h - koreanPrice` (고가대비 차액)
     - `lowDiffKrw = koreanPrice - low24h` (저가대비 차액)
   - **적용 위치:** src/components/PremiumTable.tsx의 PremiumTableRow 컴포넌트
   - **표시 옵션:**
     - 김프/전일대비: `formatKrwDynamic(value, { signed: true })` (부호 포함)
     - 고가/저가: `formatKrwDynamic(value, { signed: false })` (부호 없음)
   - **효과:** API가 0으로 내려줘도 프론트에서 정확한 차액 계산 및 표시
   - 백엔드 파이프라인 변경 없음 (고정)

4. ✅ **고가/저가 컬럼 라벨 수정 - "24h 기준" 명확화**
   - src/components/PremiumTable.tsx: 테이블 헤더 라벨 변경
   - **변경 내용:**
     - "고가대비" → "고가대비(24h)"
     - "저가대비" → "저가대비(24h)"
   - **효과:** 24시간 기준임을 사용자에게 명확히 전달
   - 계산 로직은 이미 high24h/low24h 기준이므로 변경 없음

**✅ WebSocket → prices.json → API 파이프라인 버그 수정:**

1. ✅ **Map.forEach 버그 수정**
   - workers/priceWorker.ts: Map.forEach가 (value, key) 순서임을 명확히 함
   - 이전: 매개변수 순서 오해로 WebSocket 가격 병합 실패
   - 수정: 명시적 (wsPrice, wsKey) 매개변수로 정상 병합

2. ✅ **REST API 덮어쓰기 방지**
   - workers/priceWorker.ts: dirtyPriceKeys로 WebSocket 업데이트 보호
   - 이전: REST API가 ts=Date.now()로 WebSocket 가격을 덮어씀
   - 수정: dirtyPriceKeys 체크로 WebSocket 가격 우선순위 보장

3. ✅ **실시간 데이터 완전성 확보**
   - volume24hQuote, change24hRate, high24h, low24h 모두 포함
   - WebSocket 데이터가 prices.json → API까지 완전히 전달됨

**성능 측정:**
- WebSocket latency: **1-3초** (목표 <1s 근접)
- 가격 개수: **4400+개** (HealthCheck 통과)
- WebSocket 스트림: **BINANCE:271, OKX:226, BINANCE_FUTURES:276, BYBIT:9**
- API 응답 속도: **10-60ms** (캐시 효율 유지)
- 가격 업데이트 주기: **300ms** (priceWorker)

**수정 파일:**
- workers/priceWorker.ts (mergeWebSocketPrices, updatePricesOnly)
- src/pages/api/premium/table-filtered.ts (디버그 로그 제거)

**기술 상세:**
- WebSocket Map.forEach는 (value, key) 순서로 콜백 호출
- dirtyPriceKeys Set으로 WebSocket 업데이트 추적
- REST API는 fallback으로만 사용 (WebSocket 없는 거래소)
- 300ms 주기로 WebSocket + REST 하이브리드 병합

---

### Previous Changes (v3.4.28 - 2024-12-05) - 최종 모바일 UX 완성

**✅ 4개 추가 항목 완료 (12→16 완료):**

1. ✅ **KR Premium Score 게이지바 복구**
   - TodayPremiumSection.tsx: 게이지바 `w-full`, `h-2`, `flex-1` 복구
   - 모바일/PC 동일 표시

2. ✅ **개인화 설정 버튼 높이 맞추기**
   - index.tsx: `h-9` 클래스 추가 (36px)
   - IndicatorSelector.tsx: `h-9` + `text-xs sm:text-sm` 적용
   - 모바일/PC 수평 정렬 통일

3. ✅ **차트 설명 문구 개선**
   - index.tsx: "KR 기준 거래소: UPBIT / 해외 거래소 기준: BINANCE" 추가
   - 모바일: 세로 배치, PC: 가로 배치 (md:flex-row)

4. ✅ **코인셀 숫자 겹침 해결**
   - TwoLineCell.tsx: `leading-[1.1]` + 라인2 `text-[10px]` 적용
   - TwoLinePriceCell.tsx: 동일 스타일 + `leading-[1.1]`
   - 특히 BTC 행 숫자 겹침 완전 제거

5. ✅ **소수점 2자리 완전 통일**
   - formatKrwPrice: `<1` 범위 `.toFixed(2)` 통일 (이전 4자리 → 2자리)
   - PremiumTable.tsx + TwoLinePriceCell.tsx 동일 적용
   - formatPercent: 이미 2자리 완료

**성능 (유지):**
- 컴파일: **3.5s** (401 modules)
- API 응답: **10-60ms** (캐시 효율 유지)
- WebSocket: 913+ active streams
- 가격 수집: **500-900ms** (정상)
- 모바일 터치: **44px 준수** ✅

**수정 파일:**
- src/components/TodayPremiumSection.tsx
- src/pages/index.tsx
- src/components/IndicatorSelector.tsx
- src/components/TwoLineCell.tsx
- src/components/TwoLinePriceCell.tsx
- src/components/PremiumTable.tsx

**마이그레이션 안전성:**
- ✅ 기능 로직 변경 없음
- ✅ formatPercent/formatKrwPrice 안전성 검증
- ✅ UI/스타일만 개선
- ✅ 모바일 UX 16가지 항목 모두 완성

---

### System Architecture

**Core Design Principles:**
- **WebSocket + REST Hybrid Pipeline:** Real-time WebSocket (300ms) + REST fallback → prices.json → API (800ms cache)
- **WebSocket Priority Protection:** dirtyPriceKeys Set prevents REST from overwriting WebSocket prices
- **Data Segregation:** User data (Supabase) vs Real-time data (JSON files)
- **Proxy-Centric Global API Access:** Render-hosted proxy for regional bypass
- **Fast Frontend Polling:** `/api/premium/table-filtered` every 1 second
- **API Memory Caching:** 800ms TTL with 95% performance improvement (294ms → 18-60ms)
- **Infinite Scroll Rendering:** 4000 items → 100 initial, 50 per scroll
- **CoinIcon Lazy Loading:** IntersectionObserver with rootMargin 100px
- **React.memo + useCallback:** 8 helper functions for stable references

**UI/UX Specifications:**
- **Mobile-First:** iPhone SE optimized layout with 44px touch targets
- **Responsive:** sm (640px) breakpoints for mobile/tablet/desktop
- **Performance:** Infinite scroll + lazy loading + caching = <500ms target
- **Dark Mode:** Fixed to dark mode (light/dark toggle removed)
- **Text Overflow:** 모바일 심볼 8글자 이상 절단, 텍스트 2줄 leading-[1.1]

**External Dependencies:**
- Databases: Supabase (user), JSON (real-time)
- Cloud: Render (proxy)
- APIs: CoinGecko, TradingView
- Frontend: Next.js 14, React, Tailwind CSS
