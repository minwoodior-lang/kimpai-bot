# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a real-time analytics dashboard designed to track and display the "Kimchi Premium" across various cryptocurrency exchanges. Its core purpose is to provide users with up-to-date arbitrage opportunities and market insights by comparing cryptocurrency prices on Korean exchanges with global exchanges. The project focuses on real-time price collection, premium calculation, and global market metrics, offering a comprehensive view of the crypto market with a focus on the Korean premium.

### User Preferences
- I want iterative development.
- I prefer detailed explanations.

### ⛔ CRITICAL: BACKEND PIPELINE FROZEN (v3.4.29)
**NEVER modify without explicit user permission:**
- ✅ **Verified Working:** All domestic (UPBIT/BITHUMB/COINONE KRW/USDT/BTC) and global (BINANCE/OKX/BYBIT/BITGET/GATE/MEXC/HTX) markets are correctly collected with NO gaps
- ✅ **Auto-Delisting:** Delisted coins are automatically removed from collection
- ✅ **Real-time Pipeline:** WebSocket (300ms) + REST fallback working perfectly

**FROZEN Components (DO NOT TOUCH):**
- `workers/` directory (WebSocket connections, market sync)
- `workers/priceWorker.ts` (300ms update cycle)
- `data/prices.json` (structure and creation logic)
- `src/pages/api/premium/table.ts` (calculation, cache 800ms TTL)
- `src/pages/api/premium/table-filtered.ts` (mapping, filtering)
- Domestic price collection logic (KRW prices 300ms cycle)
- WebSocket merge criteria, premium calculation method, marketStats.json flow

**ALLOWED:** Frontend display, styling, formatting functions (TwoLinePriceCell.tsx, PremiumTable.tsx, etc.)

### System Architecture

**Core Design Principles:**
- **Hybrid Data Pipeline:** Utilizes a real-time WebSocket (300ms update cycle) combined with REST API fallbacks to populate `prices.json`, which then feeds the API with an 800ms cache TTL.
- **WebSocket Priority:** `dirtyPriceKeys` set ensures WebSocket updates are not overwritten by REST API data.
- **Data Storage:** User data is managed via Supabase, while real-time market data is stored in JSON files.
- **Global API Access:** A Render-hosted proxy facilitates access to global APIs, bypassing regional restrictions.
- **Frontend Performance:** Employs fast frontend polling (1 second for `/api/premium/table-filtered`), API memory caching (800ms TTL), infinite scroll for large datasets (4000 items, 100 initial, 50 per scroll), and lazy loading for coin icons using IntersectionObserver.
- **Optimization:** Leverages `React.memo` and `useCallback` for stable references and performance.

**UI/UX Specifications:**
- **Mobile-First Design:** Optimized for mobile devices (e.g., iPhone SE) with a focus on 44px touch targets.
- **Responsive Layout:** Adapts to various screen sizes with `sm` (640px) breakpoints for mobile, tablet, and desktop.
- **Performance-Oriented:** Aims for sub-500ms load times through infinite scroll, lazy loading, and caching.
- **Dark Mode:** The interface is fixed to a dark mode theme.
- **Text Handling:** Mobile symbol truncation for long names (8+ characters) and two-line text with `leading-[1.1]` to prevent overlap.
- **Numeric Formatting:** Dynamic decimal formatting for KRW values (e.g., `formatKrwDiffByBase`, `formatKrwDynamic`) and consistent 2-decimal percentage formatting.
- **Table Enhancements:** Enlarged number cell widths (`min-w-[112px] md:min-w-[128px]`) and direct use of backend-calculated values for premium and daily change to avoid frontend recalculations.

### External Dependencies
- **Databases:** Supabase (for user data), JSON files (for real-time market data)
- **Cloud Platform:** Render (used for proxy services)
- **APIs:** CoinGecko, TradingView
- **Frontend Technologies:** Next.js 14, React, Tailwind CSS

### Deployment Configuration
**⚠️ CRITICAL: This application MUST use Reserved VM deployment, NOT Autoscale.**

**Deployment Type:** Reserved VM (Web Server)
- **Build Command:** `npm run build`
- **Run Command:** `npm start` (executes `tsx server.ts`)
- **Port:** 5000 (internally), forwards to port 80 (externally)

**Why Reserved VM is Required:**
This application runs continuous background workers and WebSocket connections that operate outside of HTTP request handling:
- **Price Worker** (`workers/priceWorker.ts`): 300ms update cycle for real-time price collection
- **WebSocket Streams**: Continuous connections to multiple exchanges (Binance, OKX, Bybit, MEXC, Gate.io)
- **Chat Server**: WebSocket server for real-time chat functionality
- **Cron Jobs**: Scheduled market sync every 5 minutes

Autoscale deployments scale down to zero when idle, which would interrupt these continuous processes. Reserved VM keeps the application running continuously, ensuring uninterrupted background operations.

**Health Check Configuration:**
The server is configured to respond immediately to health checks:
- **Endpoints:** `/` and `/health`
- **Response:** 200 OK (immediate, no async operations)
- **Implementation:** Health check handlers in `server.ts` respond before Next.js initialization completes, ensuring fast response times for deployment health checks.