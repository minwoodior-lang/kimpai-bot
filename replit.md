# KimpAI v3.4.21 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

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
