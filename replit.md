# KimpAI v3.4.0 - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. The project's core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. It handles real-time price collection, premium calculation, and global market metrics, aiming to offer a comprehensive view of the crypto market with a focus on the Korean premium.

### Recent Changes (v3.4.0 - 2024-12-04)
- **Favorites Feature Complete**: Full implementation of coin favorites/watchlist functionality
  - `useUserPrefs.ts`: Added `favorites[]` array, `toggleFavorite()`, `isFavorite()` functions
  - `PremiumTable.tsx`: Star (★) toggle button with localStorage persistence, favorites-first sorting
  - `UserPrefsPanel.tsx`: Shows favorite count, warning message when filter is empty
  - Filter modes: "all" | "foreign" | "favorites" - all working with search/sort combinations
- **localStorage Persistence**: Favorites survive page refresh, cross-tab compatible

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
- **Price Collection:** Workers for individual exchanges (Upbit, Bithumb, Coinone, Binance, OKX, Bybit, Bitget, Gate.io, HTX, MEXC) fetch real-time data. Binance and Bybit specifically use the Render proxy.
- **Data Storage:** `prices.json` stores real-time price entries, and `premiumTable.json` stores calculated premium data. `exchange_markets.json` and `master_symbols.json` manage market and symbol metadata.
- **Market Data Automation:** A hourly cron job automatically updates market data from domestic exchanges and synchronizes it to `master_symbols.json`, including CMC slug mapping and TradingView symbol generation.
- **Currency Conversion:** USDT to KRW conversion uses CoinGecko's Tether API for global consistency.
- **Rate Limit Handling:** Dedicated workers for price and statistical data, combined with proxy server caching (2s for prices, 30s for 24hr stats), mitigate API rate limits.

**Code Structure:**
- `workers/`: Contains price fetching logic and the main `priceWorker.ts`.
- `proxy-server-render/`: Node.js/Express proxy server for Render deployment.
- `data/`: Stores JSON data files (`prices.json`, `premiumTable.json`, etc.).
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