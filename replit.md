### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project handles real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium. The business vision is to empower users with critical market data for informed trading decisions, leveraging the unique market dynamics of the "Kimchi Premium."

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### System Architecture

**Core Design Principles:**
- **Unified 3-Second Pipeline:** Price, premium, and volume data all flow through `priceWorker` (3s) → `prices.json` → `premiumTable.json` → API. This eliminates dependencies on `marketStats.json` for volume.
- **Data Segregation:** User personalization data (Auth, profiles, alerts, subscriptions, notices) is stored in Supabase. Real-time data (prices, premium tables, session management) is maintained in local JSON files.
- **Proxy-Centric Global API Access:** All global exchange API calls are routed through a Render-hosted proxy server to bypass regional restrictions and enhance reliability.
- **Real-time Data Processing:** The `priceWorker` runs every 3 seconds, fetching current prices and 24-hour volume data from all supported exchanges.
- **Fast Frontend Polling:** The frontend polls the `/api/premium/table-filtered` endpoint every 1 second to ensure sub-2-second UI refresh rates.
- **Robust BTC Pivot Fallback:** A defined fallback order for BTC price ensures continuous data availability.

**UI/UX and Feature Specifications:**
- **Layout:** Unified container layout with a maximum width of 1280px for consistent display.
- **Premium Table:** An API (`/api/premium/table-filtered`) provides premium data with advanced filtering capabilities.
- **Global Metrics:** An API (`/api/global-metrics`) delivers essential global market data, including FX rates, BTC dominance, and market capitalization.
- **Session Management:** Session tracking is handled via a heartbeat API and an in-memory session cache.
- **Frontend Technology:** Developed using Next.js 14, React, and Tailwind CSS.
- **Responsiveness:** Designed with a strong focus on mobile optimization and responsive layouts.
- **Table Styling:** Consistent padding and responsive design for data tables.

**Technical Implementations:**
- **Price Collection:** Exchange-specific workers (Upbit, Bithumb, Coinone, Binance, OKX, Bybit, Bitget, Gate.io, HTX, MEXC) are responsible for fetching real-time data, including `volume24hKrw` calculation.
- **Volume Calculation:**
  - **Domestic Exchanges:** Utilizes `acc_trade_price_24h` (Upbit), `acc_trade_value_24H` (Bithumb), and `quote_volume` or `target_volume * last` (Coinone) for KRW volume.
  - **Global Exchanges:** Calculates `volume24hKrw` by converting `volume24hQuote` (USDT) using the current FX rate.
- **Data Storage:** Key data is stored in `prices.json` (including `volume24hKrw`), `premiumTable.json`, `exchange_markets.json`, and `master_symbols.json`.
- **Market Data Automation:** A 5-minute cron job automatically syncs new cryptocurrency listings from domestic exchanges.
- **Rendering Optimization:** Implemented infinite scroll, API memory caching (800ms TTL), CoinIcon lazy loading, `React.memo` and `useCallback` for performance.
- **WebSocket Infrastructure:** Utilizes WebSockets for real-time price updates, with a render proxy for Binance to overcome regional blocks, and a circuit breaker logic for graceful fallback.
- **Code Structure:**
  - `workers/`: Contains logic for price fetching and statistics collection.
  - `src/pages/api/`: Houses API endpoints for data delivery.
  - `src/components/`: Stores frontend React components.
  - `data/`: Contains static JSON data files.

### External Dependencies
- **Databases/Storage:** Supabase (for user personalization data), local JSON files (for real-time market data).
- **Cloud Services:** Render (proxy server).
- **APIs:** CoinGecko API (for general crypto data).
- **Libraries/Frameworks:** Axios, Next.js 14, React, Tailwind CSS.
- **Runtime:** Node.js, TypeScript.