# KimpAI v3.4.17 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### Recent Changes (v3.4.17 - 2024-12-05) - buildPremiumTable 거래액 필드 완성
- **핵심 수정: `buildPremiumTable()` 함수 데이터 파이프라인 완성**:
  - `workers/priceWorker.ts` L276-304: premiumRows 생성 시 6개 필드 추가
  - `volume24hKrw`: 국내 거래소 거래액 (KRW 단위)
  - `volume24hForeignKrw`: 해외 거래소 거래액 (USDT → KRW 환산)
  - `change24hRate`: 전일대비 변동률 (%)
  - `change24hAbs`: 전일대비 변동금액 (KRW)
  - `high24h`, `low24h`: 24시간 고저가
- **헬퍼 함수 추가**:
  - `getKoreanStatsKey()`: 국내 거래소 통계 키 조회 (UPBIT > BITHUMB > COINONE)
  - `getGlobalStatsKey()`: 해외 거래소 통계 키 조회 (BINANCE > OKX > BYBIT > ...)
- **검증 결과**:
  - 거래액 있는 코인: 528개 / 전체 562개 (COINONE 38개는 실제 거래 없음)
  - 거래액 Top 5: XRP(3,079억), ETH(2,028억), BTC(1,772억), USDT(951억), SOL(781억)
- **데이터 흐름**: marketStats.json → priceWorker buildPremiumTable() → premiumTable.json → API → 프론트엔드

### Recent Changes (v3.4.16 - 2024-12-05) - 프리미엄 차트 분리 + 코인원 거래액 수정
- **프리미엄 차트 완전 분리 (BTC 고정)**:
  - `src/pages/index.tsx`: 프리미엄 차트는 항상 `BINANCE:BTCUSDT` 표시
  - 코인셀 차트보기(📈)와 프리미엄 차트 완전히 독립적 동작
  - 프리미엄 차트 높이 복구: `h-[320px] md:h-[480px]` (컨테이너에 100% 채움)
  - `handleChartSelect`, `chartSectionRef`, `selectedChartSymbol` 상태 제거
- **코인셀 차트보기 독립 동작**:
  - 📈 버튼 클릭 시 해당 행 아래에 TradingView 차트 펼침 (`expandedSymbol` 상태)
  - 프리미엄 차트에 영향 주지 않음
- **코인원 거래액 Fallback 로직 추가**:
  - `workers/fetchers/coinone.ts`: `quote_volume=0`일 때 `target_volume * last`로 대체 계산
  - 코인원 API 한계: 38개 코인이 거래량 0 반환 (거래 없음이 원인, 버그 아님)
  - 업비트/빗썸은 모든 코인 거래액 정상 수집 중

### Recent Changes (v3.4.15 - 2024-12-05) - 자동 아이콘 수집 + 차트보기 기능 복구
- **자동 아이콘 수집 파이프라인 추가**:
  - `scripts/buildIcons.ts`: CoinGecko API로 누락된 아이콘 URL 자동 조회
  - `package.json`: `"build:icons": "tsx scripts/buildIcons.ts"` 스크립트 추가
  - `scripts/syncMarkets.ts`: Step 7로 build:icons 추가 (기존 6단계 → 7단계)
  - 결과: 신규 상장 코인 5~10분 내 아이콘까지 포함된 완전한 코인셀 표시
- **코인셀 차트보기 기능**:
  - `src/components/PremiumTable.tsx`: 📈 버튼 클릭 시 해당 행에서 차트 펼침
  - 동작: `expandedSymbol` 상태로 해당 행 아래 TradingView 차트 표시
- **신규 상장 전체 동선 검증**:
  - 검색: matchSearch → symbol, name_ko, name_en, 초성 모두 지원 ✓
  - 정렬: 김프/전일대비/거래액 정렬 정상 ✓
  - 즐겨찾기: toggleFavorite → normalizedSymbol 기반 ✓
  - 아이콘 fallback: CoinIcon → 다중 CDN + placeholder 처리 ✓

### Recent Changes (v3.4.14 - 2024-12-05) - 모바일 홈 화면 최종 UX 튜닝 (두나무/Kimpga 기준)
- **메인 컨테이너 좌우 패딩 축소 (모바일 전용)**:
  - `src/pages/index.tsx` line 119: `px-3 md:px-6` → `px-2 md:px-6`
  - 모바일 좌우 여백: 12px → 8px (코인셀 폭 최대화)
- **차트 높이 세분화 (모바일 전용)**:
  - `src/pages/index.tsx` line 248: `h-[320px] md:h-[480px]` → `h-[260px] sm:h-[300px] md:h-[480px]`
  - SE(소형): 260px, 일반 모바일: 300px, PC: 480px
  - 차트가 화면을 덜 차지하게 해서 코인 리스트 빠르게 노출
- **섹션 간 여백 축소 (모바일 전용)**:
  - 프리미엄 차트: `mt-8 mb-6` → `mt-6 mb-4 md:mt-8 md:mb-6`
  - 테이블 섹션: `mt-6 -mx-3` → `mt-4 md:mt-6 -mx-2 md:mx-0`
  - 모바일 전체 여백 컴팩트화
- **필터바 정리 및 폰트 축소 (모바일 전용)**:
  - `src/components/PremiumTable.tsx` L765-801:
    - 라벨: text-xs → text-[12px]
    - 간격: gap-2.5 → gap-1.5, gap-1.5 → gap-1
    - 검색 높이: h-[34px] → h-[32px], 텍스트: text-xs → text-[12px]
    - 아이콘: w-4 h-4 → w-3.5 h-3.5
- **코인셀 행 패딩 축소 (모바일 전용)**:
  - 모든 td 요소: `py-3 px-3` → `py-1 md:py-3 px-2 md:px-3` (replace_all 적용)
  - 모바일에서 행 높이 축소, 코인 리스트 촘촘하게 표시
  - 아이콘 gap: `gap-2` → `gap-1.5 md:gap-3` (코인명 영역 최적화)
- **결과**: 두나무/Kimpga 모바일 수준의 정제된 UX 달성
  - 좌우 스크롤 완전 차단 (overflow-x-hidden 유지)
  - 모바일에서 정보량 효율적으로 표시
  - PC 레이아웃 완벽 보호 (모든 변경에 md: 브레이크포인트 적용)

### Recent Changes (v3.4.13 - 2024-12-05) - 자동 상장 수집 크론 작업 추가
- **자동 상장 수집 크론 구현 (5분 간격, 테스트 단계)**:
  - `server.ts` L41-56: `*/5 * * * *` 크론 스케줄 추가
  - 운영 단계 시 `0,10,20,30,40,50 * * * *` (10분 간격)로 변경 권장
  - 크론 실행 명령: `npm run sync:markets`
- **통합 파이프라인 스크립트 생성**:
  - `scripts/syncMarkets.ts`: 새 파일 생성
    - Step 1: `npm run fetch:upbit` (업비트 마켓 수집)
    - Step 2: `npm run fetch:bithumb` (빗썸 마켓 수집)
    - Step 3: `npm run fetch:coinone` (코인원 마켓 수집)
    - Step 4: `npm run build:markets` (마켓 병합)
    - Step 5: `npm run build:master-symbols` (master_symbols 통합)
    - Final: `npm run build:premium` (프리미엄 테이블 재생성)
  - 각 단계별 타임스탐프 + 진행률 로깅
  - 에러 시: stderr 출력으로 디버깅 용이
- **npm script 추가**:
  - `package.json` L28: `"sync:markets": "tsx scripts/syncMarkets.ts"` 추가
- **테스트 방법** (빗썸 신규 상장 시):
  1. 크론 자동 실행 후 → `master_symbols.json` / `exchange_markets.json`에 신규 심볼 생성 확인
  2. KimpAI 홈: 기준거래소 → 빗썸 KRW 선택 → 검색창에서 신규 코인 노출 확인

### Recent Changes (v3.4.12 - 2024-12-05) - 모바일 홈 화면 최종 조정 (코인셀 폭/차트 높이)
- **메인 컨테이너 좌우 패딩 축소 (모바일 전용)**:
  - `src/pages/index.tsx` L119: `w-full px-6` → `w-full px-3 md:px-6` (모바일 여백 12px)
- **코인 리스트 섹션 화면 끝까지 확장 (모바일 전용)**:
  - `src/pages/index.tsx` L254: `-mx-3 md:mx-0` 추가 (메인 패딩 상쇄)
- **차트 높이 모바일 전용 축소**:
  - `src/pages/index.tsx` L248: `h-[320px] md:h-[480px]` (모바일 320px, PC 480px)

### Recent Changes (v3.4.11 - 2024-12-05) - 모바일 코인셀 폭 및 레이아웃 수정
- **메인 컨테이너 반응형 수정**: max-width를 md: 이상에서만 적용
- **코인 리스트 테이블**: 전체 폭 최적화로 모바일에서 끝까지 펼침

### System Architecture

**Core Design Principles:**
- **Data Segregation:** User personalization data (Auth, profiles, alerts, subscriptions, notices) is stored in Supabase. Real-time/temporary data (price data, premium tables, concurrent users, session management) is processed and stored locally on the Replit server memory or as JSON files.
- **Proxy-Centric Global API Access:** All global exchange API calls are routed through an external Render-hosted proxy server to bypass regional restrictions and ensure reliable data fetching.
- **Real-time Data Processing:** A dedicated `priceWorker` cron job runs every 3 seconds to fetch prices from all supported exchanges, calculate premium tables, and store them in local JSON files.
- **Fast Frontend Polling:** Frontend polls `/api/premium/table-filtered` every 1 second for sub-2-second UI refresh rates.
- **Robust BTC Pivot Fallback:** A defined fallback order for BTC price (BINANCE → OKX → BITGET → GATE → MEXC) ensures price availability even if a primary source fails.

**UI/UX and Feature Specifications:**
- **Unified Container Layout:** All main sections (summary cards, premium chart, coin table, coin detail charts) are housed within a single, responsive container with a maximum width of 1280px, ensuring perfect alignment across elements.
- The system supports a comprehensive premium table API (`/api/premium/table-filtered`) with filtering capabilities for domestic and foreign exchanges, providing average premium, FX rates, and coin counts.
- A global metrics API (`/api/global-metrics`) provides FX rates (USD/KRW, USDT/KRW), BTC dominance, market cap, 24h volume, and concurrent user counts.
- Session tracking is managed via a heartbeat API (`/api/heartbeat`) and an in-memory session cache.
- The frontend uses Next.js 14, React, and Tailwind CSS for a modern, responsive design.
- Coin icons are served from the `public/icons/` directory.
- **Responsive UI Adjustments:** Specific attention has been paid to mobile responsiveness, including adjusted padding, full-width elements, and optimized chart heights for smaller screens.

**Technical Implementations:**
- **Price Collection:** Exchange-specific workers (Upbit, Bithumb, Coinone, Binance, OKX, Bybit, Bitget, Gate.io, HTX, MEXC) fetch real-time data, utilizing the Render proxy for Binance/Bybit.
- **Stats Collection:** A 30-second cron job collects 24-hour market statistics (change rate, high/low prices, volume) for all exchanges.
- **Data Storage:** `prices.json`, `marketStats.json`, and `premiumTable.json` store real-time, statistical, and calculated premium data respectively. `exchange_markets.json` and `master_symbols.json` manage market and symbol metadata.
- **Market Data Automation:** A 5-minute cron job (`npm run sync:markets`) automatically detects new listings on domestic exchanges (Upbit/Bithumb/Coinone) and syncs them to `master_symbols.json`, premium tables, and coin cells. Can be adjusted to 10-minute intervals for production.
- **Currency Conversion:** USDT to KRW conversion uses CoinGecko's Tether API for global consistency.
- **Rate Limit Handling:** Features proxy server caching (2s for prices, 5s for 24hr stats, 60s for stale fallback), 429 error handling returning stale cache, and dedicated workers with `Promise.allSettled` for graceful failure.
- **Table Styling:** Unified padding (`px-3 lg:px-4 py-2.5`) for all table headers and data cells. Detail chart wrappers feature specific styling (`border border-white/5 bg-[#050819]`).

**Code Structure:**
- `workers/`: Contains price fetching logic and the main `priceWorker.ts`.
- `workers/fetchers/`: Exchange-specific fetchers.
- `proxy-server-render/`: Node.js/Express proxy server for Render deployment.
- `data/`: Stores JSON data files.
- `scripts/`: Utility scripts.
- `src/pages/api/`: API endpoints.
- `src/components/`: Frontend React components.

### External Dependencies
- **Supabase:** User authentication, profiles, alerts, subscriptions, and notices.
- **Render:** Hosts the external proxy server for global exchange API calls.
- **CoinGecko API:** Fetches global market metrics, specifically USDT to KRW exchange rate.
- **Axios:** HTTP client for API requests.
- **Next.js 14, React, Tailwind CSS:** Frontend development stack.
- **Node.js, TypeScript:** Backend development stack.
- **Replit:** Deployment platform.