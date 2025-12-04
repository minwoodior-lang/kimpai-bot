# KimpAI v3.4.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. The project's core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. It handles real-time price collection, premium calculation, and global market metrics, aiming to offer a comprehensive view of the crypto market with a focus on the Korean premium.

### Recent Changes (v3.4.1 - 2024-12-04)
- **BINANCE_BTC Market Removed**:
  - Removed "바이낸스 BTC 마켓" option from foreign exchange dropdown (Binance has no BTC spot market)
  - Cleaned up from: ExchangeSelectionContext.tsx, exchangeFetchers.ts, IndicatorSelector.tsx, ChartSectionEnhanced.tsx
  - BINANCE_USDT and BINANCE_FUTURES markets remain fully operational
- **Binance 429 Rate Limit Resolution**: 
  - Proxy caching: 5sec for spot 24hr, 2sec for prices, 1min stale fallback
  - 429 error handling with stale cache fallback + 503 response
  - Render proxy fully tested and deployed (✓ /healthz returns v1 version)
- **Binance Futures Stats Support**:
  - Added `fetchBinanceFuturesStats()` to process `/binance/fapi/v1/ticker/24hr` data
  - Proxy route `/binance/fapi/v1/ticker/24hr` implemented with 5sec caching
  - Stats automation: 30sec cron job collects BINANCE_FUTURES:${base}:USDT stats
- **Bybit USDT Integration**: 
  - Proxy route `/bybit/v5/market/tickers` fully operational with 429 handling
  - Bybit spot prices and 24hr stats (change24hRate, high24h, low24h, volume24hQuote) working
- **Favorites Feature**: Full implementation with localStorage persistence, cross-tab compatible

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
- **Robust BTC Pivot Fallback:** A defined fallback order for BTC price (BINANCE → OKX → BITGET → GATE → MEXC) ensures price availability even if a primary source fails.

**UI/UX and Feature Specifications:**
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
1. **Render proxy manual deployment**: Deploy `/binance/fapi/v1/ticker/24hr` route addition to enable Binance Futures 24hr stats
2. **Monitor stats collection**: After proxy deployment, verify BINANCE_FUTURES stats in marketStats.json
3. **UI Frontend validation**: Confirm BINANCE_USDT and BINANCE_FUTURES dropdowns work correctly
