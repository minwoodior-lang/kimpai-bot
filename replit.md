# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI is a dashboard designed to track real-time price differences (Kimchi Premium) between Korean exchanges (Upbit, Bithumb, Coinone) and global exchanges (Binance, OKX, Bybit, etc.). It includes 24/7 background workers and a Telegram Bot. The project aims to provide real-time market insights and signal analytics to users.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구
- 외부 배포 사용 (Replit 프리뷰 제외)

### Deployment Strategy
**개발 환경 (npm run dev):**
- 봇: 완전 비활성화 (NODE_ENV 체크)
- 신호 엔진: 완전 비활성화 (NODE_ENV 체크)
- 데이터 수집: 정상 작동 (가격/김프 데이터)
- API: 정상 작동 (프론트엔드 테스트용)

**프로덕션 (외부 배포):**
- 봇: 자동 시작
- 신호 엔진: 자동 시작
- 모든 기능 활성화

### System Architecture

**Core Design Principles:**
- **Hybrid Data Pipeline:** Utilizes WebSocket (300ms updates) with REST API fallback for robust data collection, storing real-time market data in JSON files (`prices.json`).
- **Data Storage:** User-specific data is managed in Supabase, while market data is stored locally in JSON files for performance.
- **Global API Access:** Leverages a Render-hosted proxy to bypass regional restrictions.
- **Frontend Performance:** Optimised with fast polling (1s), API caching (800ms TTL), infinite scroll, and lazy loading using IntersectionObserver.
- **Backend Pipeline Stability:** The core backend data collection pipeline, including `workers/`, `priceWorker.ts`, `data/prices.json`, and premium calculation APIs, is considered frozen due to its verified stability and accuracy. Only frontend display, styling, formatting, and read-only bot API access are permitted modifications.

**Key Features:**
- **Admin v2.0 Dashboard:** Secure dashboard with JWT authentication, bcrypt hashing, httpOnly cookies, and rate limiting. Provides 8 tabs for monitoring system health, price feeds, symbols, premium engine, workers, listings, frontend performance, and tools.
- **Telegram Bot v2.4:** Built with Telegraf.js, offering 10 commands (7 FREE, 3 PRO) and real-time signals. Provides Kimchi Premium surge alerts and whale activity signals based on Binance TOP 100 symbols with **trend filtering** (v2.4). Includes PRO features like 48-hour BTC predictions, whale accumulation detection, and risk alerts.
- **Signal Engine:** Features FREE whale signals (v2.4) with expanded symbol range (Binance TOP 100), refined trigger filters (24h volume, trade amount, volume multiplier), and **trend-based directional filtering** (상승/하락 추세에서만 매수/매도 시그널 발송). Includes automatic startup in production environments and self-recovery mechanisms for WebSocket disconnections or inactivity.

**FREE v2.4 신호 조건 개선:**
- **추세 필터 (1시간 변동률 기반):**
  - 상승추세: price_change_1h >= +1.5%
  - 하락추세: price_change_1h <= -1.5%
- **고래 알림:** 상승추세에서만 매수 고래, 하락추세에서만 매도 고래 발송 (횡보 신호 제거)
- **김프 알림:** 김프 상승 시 LONG, 김프 하락 시 SHORT (방향성 일치 확보)
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