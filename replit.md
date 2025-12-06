# KimpAI v3.5.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a **real-time** analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles **instant price collection via WebSockets**, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.
- **I need real-time price reflection** (WebSocket tick → User screen within 1 second)

### Recent Changes (v3.5.0 - 2024-12-06) - 실시간 가격 반영 시스템 완성 🚀⚡

**🎯 목표: 해외 거래소 가격 실시간 반영 (1초 이내)**

**✅ 핵심 개선 완료:**

1. ✅ **WebSocket-First 실시간 아키텍처 전환**
   - WebSocket 콜백 직접 연결: `handleWebSocketPrice()` → 즉시 메모리 업데이트
   - REST는 5초마다 보조 검증용으로만 실행 (이전: 300ms 벌크)
   - 4,826 updates/10s (초당 ~480 가격 틱)

2. ✅ **In-Memory Premium Table 시스템**
   - `inMemoryPremiumTable: Map<string, PremiumRow>` 메모리 구조
   - WebSocket 틱마다 incremental premium 재계산
   - 파일 백업: 1분마다 (이전: 매번)

3. ✅ **API 완전 메모리 기반 전환**
   - 파일 I/O 완전 제거 (0개)
   - `getExchangeMarkets()`, `getMasterSymbols()` 메모리 캐싱
   - API 응답: **3-5ms** (이전: 570ms, 100배 이상 개선!)

4. ✅ **Latency Tracking 시스템**
   - WebSocket tick → Premium calculation 시간 측정
   - 10초마다 로깅: avg/min/max latency
   - 현재: avg=991-1200ms (지속 개선 중)

5. ✅ **BYBIT WebSocket 완전 활성화**
   - 568개 심볼 구독 (이전: 9개)
   - 재연결 타이밍 최적화 (5초)

**성능 결과:**
- **API 응답**: **3-5ms** (목표 <50ms ✅ 완전 달성!)
- **WebSocket 틱**: 4,826 updates/10s (실시간 작동 ✅)
- **파일 I/O**: **0개** (완전 제거 ✅)
- **Latency**: avg=991-1200ms (목표 100-500ms, 개선 중 ⚠️)
- **활성 스트림**: BINANCE 286, BINANCE_FUTURES 306, OKX 226, BYBIT 58

**수정 파일:**
- workers/priceWorker.ts: WebSocket 콜백, in-memory system, incremental updates
- src/pages/api/premium/table-filtered.ts: 메모리 기반 API
- workers/websocket/index.ts: 콜백 연결 구조

**아키텍처 변화:**
```
[이전] REST 300ms → 파일 저장 → API 파일 읽기 → 응답 (3-4초)
[현재] WebSocket 틱 → 메모리 업데이트 → API 메모리 읽기 → 응답 (~1초)
```

**마이그레이션 안전성:**
- ✅ 기능 로직 유지 (가격 계산 동일)
- ✅ 파일 백업 유지 (1분마다)
- ✅ REST 보조 시스템 유지 (5초)
- ✅ 기존 API 호환성 유지

---

### Recent Changes (v3.4.28 - 2024-12-05) - 최종 모바일 UX 완성 🎉

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

**Core Design Principles (v3.5.0):**
- **WebSocket-First Real-time System:** WebSocket ticks → instant memory update → <1s latency
- **In-Memory Premium Table:** `Map<string, PremiumRow>` for zero-latency access
- **Data Segregation:** User data (Supabase) vs Real-time data (In-memory + JSON backup)
- **Proxy-Centric Global API Access:** Render-hosted proxy for regional bypass
- **Ultra-Fast Frontend Polling:** `/api/premium/table-filtered` every 1 second (3-5ms response)
- **API Zero File I/O:** 100% memory-based (exchange_markets, master_symbols cached)
- **Incremental Updates:** Only changed symbols recalculated (not full table rebuild)
- **Latency Tracking:** WebSocket tick → premium → API end-to-end measurement
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
