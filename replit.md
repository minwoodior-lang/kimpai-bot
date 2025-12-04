# KimpAI v3.4.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. The project's core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. It handles real-time price collection, premium calculation, and global market metrics, aiming to offer a comprehensive view of the crypto market with a focus on the Korean premium.

### Recent Changes (v3.4.6 - 2024-12-04)
- **타이포그래피 & 레이아웃 최종 정리**:
  - 오늘의 김프 요약 라벨: text-[11px] md:text-[13px] (라벨 폰트 크기 증가)
  - 필터 바 재정렬: 기준/해외 드롭다운 + ↔를 gap-1로 묶어 한 덩어리로 배치
  - 필터 바 레이아웃: PC gap-3 → gap-4, 검색창 w-64 → w-56 (더 컴팩트하게)
  - 코인셀 메타정보 추가: TradingViewChart에 domesticExchange/foreignExchange props 전달
  - 코인셀 메타정보 텍스트: "KR 기준 거래소 / 해외 거래소 기준" (text-[11px] md:text-[13px] font-medium)

### Recent Changes (v3.4.5 - 2024-12-04)
- **타이포그래피 & UI 위계 최종 개선**:
  - 내 알림 카드 (MyAlertsCard): 제목 text-[15px] md:text-base, 본문 text-xs md:text-sm, 버튼 px-4 md:px-5 py-2 md:py-2.5로 위계 정렬
  - 오늘의 AI 김프 요약: 지표 라벨 text-[11px] md:text-xs, 값 text-sm md:text-[15px], KR Premium Score 카드 → 좌우 정렬 (라벨+게이지 / 점수)
- **필터 바 라벨 순서 통일**:
  - 라벨 순서: "기준 거래소 [드롭다운] ↔ [드롭다운] 해외 거래소" 최종 확정
- **코인셀 확장 차트 레이아웃 개선**:
  - 확장 행 td: colSpan={8} + className="p-0" 적용
  - 안쪽 wrapper: div.w-full만 유지, 모든 px/mx 제거

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
