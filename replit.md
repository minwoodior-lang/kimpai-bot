# KimpAI v3.4.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

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
- **Market Data Automation:** An hourly cron job automatically updates market data from domestic exchanges and synchronizes it to `master_symbols.json`, including CMC slug mapping.
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