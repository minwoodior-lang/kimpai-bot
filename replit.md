# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI는 한국 거래소(Upbit, Bithumb, Coinone)와 글로벌 거래소(Binance, OKX, Bybit 등) 간의 가격 차이를 실시간으로 추적하는 대시보드입니다. 24/7 백그라운드 워커와 최근 Telegram Bot v1.0을 포함합니다.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구

### 최신 변경사항 (2024-12-09)
**Telegram 유저 Supabase 동기화 구현:**
- ✅ `upsertTelegramUserFromCtx()` 함수 추가 (supabase.js)
- ✅ `/start` 명령어에서 자동 유저 저장
- ✅ Watchlist 함수들과 Supabase 정상 연동 검증
- ✅ 테스트 가이드 작성 (SUPABASE_USER_TEST.md, SUPABASE_SYNC_SUMMARY.md)

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
- **Hybrid Data Pipeline:** WebSocket (300ms) + REST API fallback → `prices.json` → API (800ms cache TTL)
- **WebSocket Priority:** `dirtyPriceKeys` set ensures WebSocket updates are not overwritten by REST
- **Data Storage:** User data in Supabase, real-time market data in JSON files
- **Global API Access:** Render-hosted proxy bypasses regional restrictions
- **Frontend Performance:** Fast polling (1s), API caching (800ms), infinite scroll, lazy loading with IntersectionObserver

**Telegram Bot v1.0:**
- **Framework:** Telegraf.js + node-cron
- **Commands:** 10개 (FREE 7개 + PRO 3개)
- **Auto-Scan:** 4개 (10분, 30분, 5분, 6시간)
- **API:** 7개 엔드포인트 (BTC, ETH, ALT, PRO)
- **Data:** Supabase `telegram_users` 테이블 (사용자, 관심종목, PRO 여부)

### Telegram Bot Features
**FREE (무료):**
- `/start` - 봇 소개 및 유저 자동 저장
- `/btc` - BTC 김프 감지
- `/eth` - ETH 변동성
- `/alt {symbol}` - ALT 분석
- `/watchlist` - 관심종목 확인
- `/add_watchlist {symbol}` - 관심종목 추가
- `/remove_watchlist {symbol}` - 관심종목 제거

**PRO (구독):**
- `/pro_btc` - 48시간 예측
- `/pro_whale {symbol}` - 고래 매집 감지
- `/pro_risk {symbol}` - 리스크 경고

**Auto-Scan:**
- FREE ALT - 10분마다 TOP50 변동성
- FREE BTC - 30분마다 김프 변화
- PRO Watchlist - 5분마다 관심종목 감시
- PRO BTC Forecast - 6시간마다 48시간 예측

### External Dependencies
- **Databases:** Supabase (사용자 데이터), JSON (실시간 시장 데이터)
- **Cloud Platform:** Render (proxy 서비스)
- **APIs:** CoinGecko, TradingView, Binance, OKX, Bybit 등
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Bot:** Telegraf.js, node-cron

### Deployment Configuration
**⚠️ CRITICAL: Reserved VM deployment required (NOT Autoscale)**

**Type:** Reserved VM (Web Server)
- **Build:** `npm run build`
- **Run:** `npm start` (executes `tsx server.ts`)
- **Port:** 5000 (internal) → 80 (external)

**Why Reserved VM:**
- Price Worker (300ms cycle) - continuous
- WebSocket streams - continuous
- Chat Server - always running
- Cron jobs - 5분마다

Autoscale would break continuous processes.

### Important Files
- `src/components/PremiumTable.tsx` - 메인 테이블
- `src/bot/index.js` - 봇 메인 엔진
- `src/bot/commands/free.js` - FREE 명령어
- `src/bot/commands/pro.js` - PRO 명령어
- `src/bot/utils/supabase.js` - Supabase 통합 (← 최근 업데이트)
- `src/pages/api/bot/*` - 봇 API 엔드포인트
- `server.ts` - Express 서버 (워커 시작)

### Testing
**Telegram Bot:**
- Start: `npm run bot:dev`
- Test: `/start`, `/btc`, `/eth`, `/alt BTC`, `/add_watchlist SUI`
- Log check: `✅ telegram_users upsert success` 확인
- DB check: Supabase `telegram_users` 테이블 확인

**테스트 가이드:**
- `SUPABASE_USER_TEST.md` - 상세 테스트 절차
- `TEST_COMMANDS.md` - 모든 명령어 테스트 방법
