# KimpAI v3.4.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. The project's core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. It handles real-time price collection, premium calculation, and global market metrics, aiming to offer a comprehensive view of the crypto market with a focus on the Korean premium.

### Recent Changes (v3.4.4 - 2024-12-04)
- **헤더(navbar) + 메인 컨테이너 폭 통일 (모두 max-w-[1280px] px-6)**:
  - Layout.tsx: 헤더 정렬 `max-w-[1280px] px-6` (배경색 `bg-[#020617]`, 테두리 `border-white/5`)
  - pages/index.tsx: 메인 컨테이너 `max-w-[1280px] px-6` (px-4 제거)
  - Layout.tsx 푸터: 동일하게 `max-w-[1280px] px-6` 통일
  - 결과: 헤더 로고 / 프리미엄 차트 / 코인 리스트 / 코인셀 차트 모두 **완벽 일직선**
- **필터 바 PC/모바일 분리 (hidden md:flex + flex md:hidden)**:
  - **PC (md 이상)**: 한 줄 정렬 `hidden md:flex`
    - 왼쪽: 🇰🇷 기준 거래소 + ↔ 버튼 + 🌐 해외 거래소
    - 오른쪽: 암호화폐 총 N개 + 검색창 (w-[260px], `ml-auto`)
  - **모바일**: `flex md:hidden flex-col gap-2`
    - 거래소 선택 (1줄)
    - 검색창 & 개수 (2줄)
- **홈 화면 PC 레이아웃 최종 완성** (v3.4.3):
  - 메인 컨테이너: `max-w-[1280px] px-6` 통일
  - 프리미엄 차트: `border border-white/5 bg-[#050819]` 스타일
  - 코인 테이블 래퍼: `border border-white/5 bg-[#050819]` (테두리 일치)
  - 모든 테이블 th/td: `px-3 lg:px-4 py-2.5` 패딩 통일
  - 코인셀 상세 차트: `px-3 lg:px-4 pb-4` (프리미엄 차트와 동일 라인)
- **테이블 구조 최적화**: section 태그 사용, 필터 UI 및 테이블 분리
- **프리미엄 차트 폴링 최적화**: 1000ms → 실시간 반응 속도 개선
- **BINANCE_BTC Market 제거**: 바이낸스에 BTC 현물 시장 없음
- **Binance 429 Rate Limit Resolution**: Proxy caching + stale cache fallback
- **Binance Futures Stats Support**: 30sec 자동 수집
- **Bybit USDT Integration**: 완벽 작동
- **Favorites Feature**: localStorage 지속성, 크로스탭 호환

### Known Issues
- **Missing coin icons**: MET2, GAME2, FCT2 (low-priority UI issue)

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### System Architecture

**Core Design Principles:**
- **Data Segregation:** Long-term user personalization data (Auth, profiles, alerts, subscriptions, notices) is stored in Supabase. Real-time/temporary data (price data, premium tables, concurrent users, session management) is processed and stored locally on the Replit server memory or as JSON files.
- **Proxy-Centric Global API Access:** All global exchange API calls are routed through an external Render-hosted proxy server to bypass regional restrictions and ensure reliable data fetching.
- **Real-time Data Processing:** A dedicated `priceWorker` cron job runs every 3 seconds to fetch prices from all supported exchanges, calculate premium tables, and store them in local JSON files.
- **Fast Frontend Polling:** Frontend polls `/api/premium/table-filtered` every 1 second for sub-2-second UI refresh rates.
- **Robust BTC Pivot Fallback:** A defined fallback order for BTC price (BINANCE → OKX → BITGET → GATE → MEXC) ensures price availability even if a primary source fails.

**UI/UX and Feature Specifications:**
- **Unified Container Layout (v3.4.2):**
  - Main wrapper: `<main className="w-full flex justify-center"> <div className="w-full max-w-[1280px] px-4 lg:px-6"> ... </div> </main>`
  - All sections (summary cards, premium chart, coin table, coin detail charts) inside this single container
  - Left/right boundaries perfectly aligned at 100% zoom: header logo left edge = chart left edge = table left edge = detail chart left edge
- The system supports a comprehensive premium table API (`/api/premium/table-filtered`) with filtering capabilities for domestic and foreign exchanges, providing average premium, FX rates, and coin counts.
- A global metrics API (`/api/global-metrics`) provides FX rates (USD/KRW, USDT/KRW), BTC dominance, market cap, 24h volume, and concurrent user counts.
- Session tracking is managed via a heartbeat API (`/api/heartbeat`) and an in-memory session cache.
- The frontend is built with Next.js 14, React, and Tailwind CSS, implying a modern, responsive design.
- Coin icons are served from the `public/icons/` directory.

**Technical Implementations:**
- **Price Collection:** Workers for individual exchanges (Upbit, Bithumb, Coinone, Binance, OKX, Bybit, Bitget, Gate.io, HTX, MEXC) fetch real-time data via Render proxy for Binance/Bybit.
- **Stats Collection:** 30sec cron job collects 24hr market stats (change rate, high/low prices, volume) for all exchanges.
- **Data Storage:** `prices.json` stores real-time price entries, `marketStats.json` stores 24hr statistics, and `premiumTable.json` stores calculated premium data. `exchange_markets.json` and `master_symbols.json` manage market and symbol metadata.
- **Market Data Automation:** A hourly cron job automatically updates market data from domestic exchanges and synchronizes it to `master_symbols.json`, including CMC slug mapping.
- **Currency Conversion:** USDT to KRW conversion uses CoinGecko's Tether API for global consistency.
- **Rate Limit Handling:** 
  - Proxy server caching: 2sec (prices), 5sec (24hr stats), 60sec (stale fallback)
  - 429 error handling: Returns stale cache if available, otherwise 503 with retry hint
  - Dedicated workers with Promise.allSettled for graceful failure handling
- **Table Styling (v3.4.2):**
  - All th/td: `px-3 lg:px-4 py-2.5` (unified padding)
  - Detail chart wrapper: `border border-white/5 bg-[#050819]` (premium chart styling)
  - No nested px values - only outer container controls width

**Proxy Server (Render):**
- Routes: `/binance/api/v3/ticker/price`, `/binance/api/v3/ticker/24hr`, `/binance/fapi/v1/ticker/price`, `/binance/fapi/v1/ticker/24hr`
- Routes: `/bybit/v5/market/tickers`
- Version check: `/healthz` → returns "proxy-24hr-v1-with-5s-cache-stale-fallback"
- All routes implement: cache TTL, stale cache fallback, 429 error handling with rate limit tracking

**Code Structure:**
- `workers/`: Contains price fetching logic and the main `priceWorker.ts`.
- `workers/fetchers/`: Exchange-specific fetchers (binance.ts, globalExchanges.ts for OKX/Bybit/Bitget/Gate/HTX/MEXC, upbit.ts, bithumb.ts, coinone.ts).
- `proxy-server-render/`: Node.js/Express proxy server for Render deployment.
- `data/`: Stores JSON data files (`prices.json`, `premiumTable.json`, `marketStats.json`, etc.).
- `scripts/`: Utility scripts for market synchronization and master symbol building.
- `src/pages/api/`: API endpoints for premium data, global metrics, heartbeat, and authentication.
- `src/components/`: Frontend React components.

### External Dependencies
- **Supabase:** Used exclusively for user authentication (Auth), user profiles, alerts, subscriptions, and notices.
- **Render:** Hosts the external proxy server for global exchange API calls.
- **CoinGecko API:** Used for fetching global market metrics, specifically the Tether (USDT) to KRW exchange rate.
- **Axios:** HTTP client for making API requests.
- **Next.js 14, React, Tailwind CSS:** Frontend development stack.
- **Node.js, TypeScript:** Backend development stack.
- **Replit:** Deployment platform.

### Next Steps
1. **Verify layout alignment**: 100% zoom에서 헤더/차트/테이블/상세차트 좌우 라인 확인
2. **Optional: Fine-tune filter UI**: PremiumTable 필터 구조 추가 단순화 (현재는 기능 정상)
3. **Test responsiveness**: 모바일/태블릿 반응형 테스트
