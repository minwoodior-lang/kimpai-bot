# KimpAI - Kimchi Premium Analytics Dashboard

### Overview
KimpAI는 한국 거래소(Upbit, Bithumb, Coinone)와 글로벌 거래소(Binance, OKX, Bybit 등) 간의 가격 차이를 실시간으로 추적하는 대시보드입니다. 24/7 백그라운드 워커와 최근 Telegram Bot v1.0을 포함합니다.

### User Preferences
- 이터러티브 개발 선호
- 상세한 설명 요구

### 최신 변경사항 (2024-12-09)
**FREE 텔레그램 알림 실제 데이터 파이프라인 연결:**
- ✅ API 엔드포인트 실제 데이터 연결 (btc.ts, eth.ts, alts.ts, alts/[symbol].ts)
- ✅ premiumTable.json, marketStats.json 데이터 사용
- ✅ AI 해석 유틸 함수 추가 (aiInterpret.js) - GPT 연동 준비 완료
- ✅ FREE 스케줄러 수정 (freeScan.js) - 실제 데이터 + AI 해석 연동
- ✅ FREE 명령어 수정 (free.js) - 실제 API 데이터 + AI 해석

**이전 변경사항:**
- Telegram 유저 Supabase 동기화 구현
- `upsertTelegramUserFromCtx()` 함수 추가
- Watchlist 함수들과 Supabase 정상 연동 검증

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

**Telegram Bot v1.1:**
- **Framework:** Telegraf.js + node-cron
- **Commands:** 10개 (FREE 7개 + PRO 3개)
- **Auto-Scan:** 4개 (10분, 30분, 5분, 6시간)
- **API:** 7개 엔드포인트 (BTC, ETH, ALT, PRO) - **실제 데이터 파이프라인 연결**
- **AI 해석:** GPT-4o-mini 연동 준비 (OPENAI_API_KEY 필요)
- **Data:** Supabase `telegram_users` 테이블 (사용자, 관심종목, PRO 여부)

### Telegram Bot Features
**FREE (무료):**
- `/start` - 봇 소개 및 유저 자동 저장
- `/btc` - BTC 김프 감지 (실제 premiumTable.json 데이터)
- `/eth` - ETH 변동성 (실제 marketStats.json 데이터)
- `/alt {symbol}` - ALT 분석 (실제 데이터)
- `/watchlist` - 관심종목 확인
- `/add_watchlist {symbol}` - 관심종목 추가
- `/remove_watchlist {symbol}` - 관심종목 제거

**PRO (구독):**
- `/pro_btc` - 48시간 예측
- `/pro_whale {symbol}` - 고래 매집 감지
- `/pro_risk {symbol}` - 리스크 경고

**Auto-Scan:**
- FREE ALT - 10분마다 TOP50 변동성 (조건 기반 상위 3개 선택)
- FREE BTC - 30분마다 김프 변화
- PRO Watchlist - 5분마다 관심종목 감시
- PRO BTC Forecast - 6시간마다 48시간 예측

### AI 해석 기능
**파일:** `src/bot/utils/aiInterpret.js`
- GPT-4o-mini 모델 사용
- 신호 타입별 맞춤 프롬프트 (FREE_BTC, FREE_ALT, FREE_ETH, PRO_*)
- Fallback 메시지 지원 (API 키 없을 때)
- **설정 필요:** `OPENAI_API_KEY` 환경변수

### External Dependencies
- **Databases:** Supabase (사용자 데이터), JSON (실시간 시장 데이터)
- **Cloud Platform:** Render (proxy 서비스)
- **APIs:** CoinGecko, TradingView, Binance, OKX, Bybit, OpenAI (AI 해석)
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
- `src/bot/commands/free.js` - FREE 명령어 (실제 데이터 + AI 해석)
- `src/bot/commands/pro.js` - PRO 명령어
- `src/bot/schedulers/freeScan.js` - FREE 자동 스캔 (실제 데이터 + AI 해석)
- `src/bot/utils/supabase.js` - Supabase 통합
- `src/bot/utils/aiInterpret.js` - AI 해석 함수 (GPT 연동)
- `src/pages/api/bot/*` - 봇 API 엔드포인트 (실제 데이터)
- `server.ts` - Express 서버 (워커 시작)

### Testing
**Telegram Bot:**
- Start: `npm run bot:dev`
- Test: `/start`, `/btc`, `/eth`, `/alt SUI`, `/add_watchlist BTC`
- API Test: `curl http://localhost:5000/api/bot/btc`
- API Test: `curl http://localhost:5000/api/bot/alts?limit=5`
- Log check: `✅ telegram_users upsert success` 확인

**테스트 가이드:**
- `SUPABASE_USER_TEST.md` - 상세 테스트 절차
- `TEST_COMMANDS.md` - 모든 명령어 테스트 방법

### Environment Variables
**필수:**
- `TELEGRAM_BOT_TOKEN` - 텔레그램 봇 토큰
- `TELEGRAM_CHANNEL_ID` - 자동 알림 채널 ID
- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_KEY` - Supabase API 키

**선택:**
- `OPENAI_API_KEY` - AI 해석 기능 활성화 (없으면 fallback 메시지 사용)
- `API_URL` - API 베이스 URL (기본: http://localhost:5000)
