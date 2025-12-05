# KimpAI v3.4.26 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### Recent Changes (v3.4.26 - 2024-12-05) - Binance WebSocket via Proxy + Volume Data Verified

**Render Proxy WebSocket Relay 완성 + 거래액 데이터 검증 완료**

**핵심 성과:**

1. **Binance WebSocket via Render Proxy (정상 작동)**:
   - BINANCE Spot: 328 active streams via `/ws/binance/spot`
   - BINANCE Futures: 350 active streams via `/ws/binance/futures`
   - OKX: 226 active streams (direct connection)
   - Bybit, MEXC, Gate.io: Connected with auto-reconnect

2. **거래액 데이터 파이프라인 완전 검증**:
   - STATS_DEBUG 로그 확인:
     - BINANCE BTC: $1.68B
     - BINANCE_FUTURES BTC: $14.86B
     - BYBIT BTC: $756M
     - GATE BTC: $908M
     - MEXC BTC: $916M
   - 4,520 stats entries per update cycle

3. **Performance Metrics**:
   - Price updates: ~700ms per cycle (3,219 entries)
   - Stats updates: ~1.5s per cycle (4,520 stats)
   - WebSocket active streams: 904+ total
   - Premium table: 558 rows

4. **안정화된 아키텍처**:
   - Binance regional block → Render Proxy bypass
   - MEXC auto-reconnect (3s delay)
   - Volume data: domestic + foreign 모두 표시

**Debug Logging Added**:
- `[STATS_DEBUG]` for foreign exchange volume verification
- `[WS] Active streams:` for WebSocket status monitoring

**수정 금지 영역:**
- `src/pages/api/premium/table-filtered.ts`
- `src/components/PremiumTable.tsx`
- `workers/fetchers/*` (모든 거래소 fetcher)
- `data/*.json` 구조

---

### Recent Changes (v3.4.25 - 2024-12-05) - WebSocket Hybrid 300ms Ultra-Fast Mode

**Target: 0.1-0.3 second latency for real-time updates**

**Key Changes:**

1. **ULTRA-FAST 300ms Interval**:
   - priceWorker: `setInterval(300ms)` (ULTRA-FAST mode)
   - Dirty-set pattern for efficient file writes
   - Parallel REST fetching with `Promise.allSettled`

2. **WebSocket Infrastructure**:
   - All handlers now include `high24h`, `low24h`, `volume24hQuote`
   - OKX: 226 active streams
   - Bybit, MEXC, Gate.io: Connected
   - Binance Spot/Futures: Circuit breaker (451 regional block) with 5-min REST fallback

3. **Render Proxy Configuration**:
   - Environment: `RENDER_PROXY_URL` for WebSocket relay
   - Binance WS routes: `/ws/binance/spot`, `/ws/binance/futures` (pending deployment)
   - Graceful fallback: Proxy WS → Direct WS → REST

4. **Performance Metrics**:
   - Price update latency: 500-850ms (improved from 700ms+)
   - 2,500+ price entries updated per cycle
   - 558 premium table rows

**Circuit Breaker Logic**:
- Trips after 5 consecutive failures
- 5-minute REST fallback period
- Auto-reset after successful connection

**수정 금지 영역:**
- `src/pages/api/premium/table-filtered.ts`
- `src/components/PremiumTable.tsx`
- `workers/fetchers/*` (모든 거래소 fetcher)
- `data/*.json` 구조

---

### Recent Changes (v3.4.23 - 2024-12-05) - Binance Futures 연동 완료 + 속도 최적화

**🚀 핵심 변경사항:**

1. **Binance Futures 24hr Stats 정상 작동**:
   - 프록시 서버에 `/binance/fapi/v1/ticker/24hr` 라우트 추가 완료
   - 369개 BINANCE_FUTURES 마켓 모두 volume24hQuote > 0 ✓
   - 바이낸스 선물 거래액(일) 정상 표시

2. **속도 최적화 패치 (v3.4.24)**:
   - priceWorker: cron → **setInterval 700ms** (초고속)
   - statsWorker: cron → **setInterval 3000ms**
   - 프론트엔드 refreshInterval: **1000ms**
   - 병렬 처리: **Promise.allSettled** (11개 거래소 동시 호출)

3. **데이터 파이프라인 안정화**:
   - 가격 수집: **700ms 주기** (초고속)
   - 거래액 수집: **3초 주기**
   - 프론트엔드 갱신: **1초 주기**
   - 실제 수집 시간: **500~800ms** (병렬 처리 효과)

---

### Recent Changes (v3.4.22 - 2024-12-05) - Gate.io/MEXC API 필드 매핑 수정

**🔧 핵심 수정: 거래소별 API 응답 필드명 통일**

1. **Gate.io (globalExchanges.ts)**:
   - `fetchGatePrices`: `item.quoteVolume` → `item.quote_volume` (snake_case)
   - `fetchGateStats`: `item.quoteVolume` → `item.quote_volume`
   - 결과: 510개 마켓 모두 volume24hQuote > 0 ✓

2. **MEXC (globalExchanges.ts)**:
   - `fetchMexcPrices`: `item.quoteAssetVolume` → `item.quoteVolume` (camelCase)
   - `fetchMexcStats`: `item.quoteAssetVolume` → `item.quoteVolume`
   - 결과: 460개 마켓 모두 volume24hQuote > 0 ✓

3. **Binance Futures Stats**:
   - 직접 API 접근 시 451 에러 (지역 제한)
   - 프록시 URL로 설정 (`PROXY_BASE/binance/fapi/v1/ticker/24hr`)
   - **주의**: 프록시 서버(Render)에 해당 라우트 추가 필요

**API 필드명 교훈**:
- Gate.io: snake_case (`quote_volume`, `base_volume`)
- MEXC: camelCase (`quoteVolume`, `volume`)
- Binance: camelCase (`quoteVolume`, `volume`)

---

### Recent Changes (v3.4.21 - 2024-12-05) - 거래액(일) 로직 최종 픽스

**🚨 핵심 변경: marketStats.volume24hQuote 기반 1:1 마켓 매핑**

1. **table-filtered.ts 완전 재작성**:
   - `marketStats.json` 로드 추가
   - `premiumTable.volume24h*` 의존 완전 제거
   - 선택된 `domesticKey`/`foreignKey` 기준으로만 거래액 계산
   - KRW/USDT/BTC 환산 규칙:
     - KRW 마켓: `volume24hQuote` 그대로 (이미 원화)
     - USDT 마켓: `volume24hQuote × fxRate`
     - BTC 마켓: `volume24hQuote × btcKrw` (국내) / `× btcUsdtPrice × fxRate` (해외)
   - **주석으로 "임의 수정 금지 (PM 협의 필수)" 명시**

2. **PremiumTable.tsx formatVolume 함수 수정**:
   - `null/undefined` 또는 `≤ 0` → "-" 표시
   - `0 초과` → 숫자 포맷 출력
   - **주석으로 "임의 수정 금지 (PM 협의 필수)" 명시**

**결과**:
- 업비트 KRW/BTC/USDT 마켓 각각 1:1 거래액 표시 ✓
- 빗썸 KRW/BTC/USDT 마켓 각각 1:1 거래액 표시 ✓
- 코인원 KRW 마켓 1:1 거래액 표시 ✓
- 해외 거래소도 동일한 로직 적용 ✓
- 데이터 없음(null) → "-", 거래 없음(0) → "-", 거래 있음 → 숫자 출력

**데이터 파이프라인**:
```
Ticker API → statsWorker → marketStats.json (volume24hQuote)
                                     ↓
table-filtered API → 선택된 마켓 키로 직접 조회 → KRW 환산 → 프론트엔드
```

---

### Recent Changes (v3.4.20 - 2024-12-05) - 거래액 표시 버그 완전 수정

**핵심 수정: `|| null` → `?? null` (nullish coalescing)**

---

### Recent Changes (v3.4.19 - 2024-12-05) - 거래액(일) 파이프라인 완전 통합 (priceWorker)
- **핵심 개선: 3초 priceWorker에 24시간 거래액 계산 통합**:
  - 이전: marketStats.json(30초 갱신) → 많은 코인이 거래액 없음("-" 표시)
  - 현재: priceWorker(3초) → 각 거래소 ticker 응답에서 직접 거래액 계산
  - 최종 파이프라인: **가격/김프/거래액 = 전부 3초 priceWorker → prices.json → premiumTable.json → API**

- **변경 내역**:
  1. **types.ts**: PriceEntry에 `volume24hKrw?: number` 필드 추가
  2. **upbit.ts**: `acc_trade_price_24h` → `volume24hKrw` 저장
  3. **bithumb.ts**: `acc_trade_value_24H` → `volume24hKrw` 저장
  4. **coinone.ts**: `quote_volume` 또는 `target_volume * last` → `volume24hKrw` 저장
  5. **글로벌 fetcher들** (Binance, OKX, Bybit, Bitget, Gate, HTX, MEXC): `volume24hKrw: 0` 초기값 저장
  6. **priceWorker.ts**:
     - 함수 추가: `getKoreanVolume24h()` (국내 거래액: UPBIT > BITHUMB > COINONE)
     - 함수 추가: `getGlobalVolume24h()` (글로벌 거래액: BINANCE > OKX > BYBIT > ...)
     - buildPremiumTable()에서 domesticStats 대신 prices에서 직접 거래액 추출
     - marketStats의 volume24hQuote 의존도 완전 제거
  7. **table-filtered.ts**: premiumTable.json의 `volume24hKrw` / `volume24hForeignKrw` 직접 사용

- **결과**:
  - SUI (279억), TAIKO (230억), MON (209억) 등 거래액 있는 모든 코인에서 숫자 표시 ✓
  - 거래액 없는 코인만 "-" 표시 (INTUITION 등)
  - 각 거래소 가격 갱신과 동시에 거래액도 최신화 (3초 단위)
  - API 응답 시간: 20~50ms (변화 없음)

- **남은 작업 (선택사항)**:
  - 글로벌 거래소의 volume24hKrw 실제 계산 (현재는 0으로 초기화, volume24hForeignKrw는 계산 가능)
  - 프론트엔드에서 "거래액 없는 코인" 필터 추가

### Recent Changes (v3.4.18 - 2024-12-05) - Volume display bug fixed
- Modified table-filtered.ts to use null instead of 0 as default for volume24hKrw (L132, 148, 175), ensuring proper "-" display only when data truly missing

### Recent Changes (v3.4.17 - 2024-12-05) - buildPremiumTable 거래액 필드 완성
- Added 6 stats fields to buildPremiumTable()
- Data pipeline: marketStats.json → priceWorker buildPremiumTable() → premiumTable.json → API → frontend

### System Architecture

**Core Design Principles:**
- **Unified 3-Second Pipeline:** Price, premium, and volume data all flow through priceWorker (3s) → prices.json → premiumTable.json → API. No dependency on marketStats.json for volume.
- **Data Segregation:** User personalization data (Auth, profiles, alerts, subscriptions, notices) stored in Supabase. Real-time data (prices, premium tables, session management) in local JSON files.
- **Proxy-Centric Global API Access:** All global exchange API calls routed through Render-hosted proxy server.
- **Real-time Data Processing:** priceWorker runs every 3 seconds, fetching prices AND volume from all supported exchanges.
- **Fast Frontend Polling:** Frontend polls `/api/premium/table-filtered` every 1 second for sub-2-second UI refresh.
- **Robust BTC Pivot Fallback:** Defined fallback order for BTC price ensures availability.

**UI/UX and Feature Specifications:**
- Unified container layout with maximum width 1280px
- Premium table API (`/api/premium/table-filtered`) with filtering capabilities
- Global metrics API (`/api/global-metrics`) providing FX rates, BTC dominance, market cap
- Session tracking via heartbeat API and in-memory session cache
- Frontend: Next.js 14, React, Tailwind CSS
- Responsive design with attention to mobile optimization

**Technical Implementations:**
- **Price Collection:** Exchange-specific workers (Upbit, Bithumb, Coinone, Binance, OKX, Bybit, Bitget, Gate.io, HTX, MEXC) fetch real-time data with volume24hKrw calculation
- **Volume Calculation:**
  - Domestic: Upbit `acc_trade_price_24h` (KRW), Bithumb `acc_trade_value_24H` (KRW), Coinone `quote_volume` or `target_volume * last`
  - Global: `volume24hQuote` (USDT) × FX rate → volume24hKrw
- **Data Storage:** `prices.json` (includes volume24hKrw), `premiumTable.json`, `exchange_markets.json`, `master_symbols.json`
- **Market Data Automation:** 5-minute cron job syncs new listings from domestic exchanges
- **Table Styling:** Unified padding and responsive design
- **Code Structure:**
  - `workers/`: Price fetching logic, stats collection
  - `src/pages/api/`: API endpoints
  - `src/components/`: Frontend React components
  - `data/`: JSON data files

**External Dependencies**
- Supabase, Render (proxy server), CoinGecko API
- Axios, Next.js 14, React, Tailwind CSS
- Node.js, TypeScript
