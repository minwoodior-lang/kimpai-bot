# KimpAI v3.4.19 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

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
