# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a dashboard designed to track real-time price differences (Kimchi Premium) between Korean exchanges (Upbit, Bithumb, Coinone) and global exchanges (Binance, OKX, Bybit, etc.). It includes 24/7 background workers and a Telegram Bot. The project aims to provide real-time market insights and signal analytics to users.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구

### System Architecture

**Core Design Principles:**
- **Hybrid Data Pipeline:** Utilizes WebSocket (300ms updates) with REST API fallback for robust data collection, storing real-time market data in JSON files (`prices.json`).
- **Data Storage:** User-specific data is managed in Supabase, while market data is stored locally in JSON files for performance.
- **Global API Access:** Leverages a Render-hosted proxy to bypass regional restrictions.
- **Frontend Performance:** Optimised with fast polling (1s), API caching (800ms TTL), infinite scroll, and lazy loading using IntersectionObserver.
- **Backend Pipeline Stability:** The core backend data collection pipeline, including `workers/`, `priceWorker.ts`, `data/prices.json`, and premium calculation APIs, is considered frozen due to its verified stability and accuracy. Only frontend display, styling, formatting, and read-only bot API access are permitted modifications.

**Key Features:**
- **Admin v2.0 Dashboard:** Secure dashboard with JWT authentication, bcrypt hashing, httpOnly cookies, and rate limiting. Provides 8 tabs for monitoring system health, price feeds, symbols, premium engine, workers, listings, frontend performance, and tools.
- **Telegram Bot v2.0:** Built with Telegraf.js, offering 10 commands (7 FREE, 3 PRO) and real-time signals. It provides Kimchi Premium surge alerts and whale activity signals based on Binance TOP 100 symbols (24h volume). Includes PRO features like 48-hour BTC predictions, whale accumulation detection, and risk alerts.
- **Signal Engine:** Features FREE whale signals (v2.4) with expanded symbol range (Binance TOP 100), refined trigger filters (24h volume, trade amount, volume multiplier), and 200EMA trend filtering. Includes automatic startup in production environments and self-recovery mechanisms for WebSocket disconnections or inactivity.
- **AI Interpretation:** Integrates GPT-4o-mini for PRO-exclusive signal interpretation and analysis, with a fallback to predefined messages if the OpenAI API key is unavailable.
- **Charting:** Generates Python mplfinance charts (1200x600px) with Heikin-Ashi 5-minute candles, SMA20, EMA200, RSI(14), and MACD.

**Telegram Bot Command Categories:**
- **FREE:** `/start`, `/btc`, `/eth`, `/alt {symbol}`, `/watchlist`, `/add_watchlist {symbol}`, `/remove_watchlist {symbol}`.
- **ADMIN (Diagnostic):** `/signal_status`, `/signal_test`, `/signal_restart`.
- **PRO (Subscription):** `/pro_btc`, `/pro_whale {symbol}`, `/pro_risk {symbol}`.

**Auto-Scan Features:**
- FREE ALT scans for rapid price changes and volatility every 10 minutes.
- FREE BTC monitors Kimchi Premium changes every 30 minutes.
- PRO Watchlist monitors user-defined symbols every 5 minutes.
- PRO BTC Forecast provides 48-hour predictions every 6 hours.

**Supabase `users` Table Schema:**
```sql
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  join_at TIMESTAMP DEFAULT NOW(),
  joined_from TEXT DEFAULT 'direct_dm',
  last_active TIMESTAMP DEFAULT NOW(),
  is_pro BOOLEAN DEFAULT FALSE,
  watchlist TEXT[] DEFAULT '{}'
);
```

### External Dependencies
- **Databases:** Supabase (for user data), local JSON files (for real-time market data).
- **Cloud Platform:** Render (for proxy services and deployment of Reserved VMs).
- **APIs:** CoinGecko, TradingView, Binance, OKX, Bybit, OpenAI (for AI interpretation).
- **Frontend Frameworks:** Next.js 14, React, Tailwind CSS.
- **Bot Frameworks/Libraries:** Telegraf.js, node-cron.