# KimpAI v3.3.1 - Kimchi Premium Analytics Dashboard

## 📋 상태: 프록시 서버 통합 완료 (Phase 5.1 ✅)

### 최종 아키텍처 (2025-12-04)

**✅ 핵심 전환:**

#### [Supabase에만 보관할 데이터]
- 🔐 Auth (회원가입/로그인) - Supabase Auth
- 👤 profiles (사용자 프로필)
- 🔔 alerts (알림/설정)
- 📬 subscriptions (구독 정보)
- 📝 notices (공지사항)

→ 장기 보관이 필요한 "유저 개인화 데이터"만 Supabase에 저장

#### [Replit 서버 메모리/로컬 JSON 저장]
- 📊 실시간 시세 (10개 거래소 API)
- 📈 프리미엄 계산 테이블 (premiumTable.json)
- 💹 가격 데이터 (prices.json - 4,507 entries)
- 👥 동시접속자 추적 (메모리 Map)
- 🔄 세션 관리 (heartbeat)

→ 실시간/임시 데이터는 Replit 서버에서만 처리 (Supabase 제거)

---

## 🌐 프록시 서버 설정 (Render)

### 외부 프록시 서버
**URL**: `https://kimpai-price-proxy-1.onrender.com`

모든 글로벌 거래소 API 호출은 반드시 프록시를 통해야 합니다.

### 엔드포인트
| 거래소 | 프록시 경로 | 직접 URL |
|--------|------------|----------|
| Binance Spot | `/binance/api/v3/ticker/price` | api.binance.com |
| Binance Futures | `/binance/fapi/v1/ticker/price` | fapi.binance.com |
| Bybit Spot | `/bybit/v5/market/tickers?category=spot` | api.bybit.com |

### 프록시 사용 파일
- `workers/fetchers/binance.ts` - Binance Spot/Futures 가격
- `workers/fetchers/globalExchanges.ts` - Bybit 가격
- `src/pages/api/proxy/binance.ts` - 내부 프록시 API
- `scripts/exchangeFetchers.ts` - Bybit fetcher

---

## 🔥 실시간 가격 수집 시스템

### priceWorker (3초 갱신)
```
workers/priceWorker.ts
├── 3초마다 모든 거래소 API 호출
├── prices.json 저장 (4,507 entries)
├── premiumTable.json 계산 (558 rows)
└── in-progress 락으로 중첩 방지
```

### 지원 거래소
| 거래소 | 상태 | 타입 | 프록시 |
|--------|------|------|--------|
| Upbit | ✅ 작동 | 한국 KRW | 직접 |
| Bithumb | ✅ 작동 | 한국 KRW | 직접 |
| Coinone | ✅ 작동 | 한국 KRW | 직접 |
| Binance | ✅ 프록시 | 글로벌 USDT | ✅ Render |
| OKX | ✅ 작동 | 글로벌 USDT | 직접 |
| Bybit | ✅ 프록시 | 글로벌 USDT | ✅ Render |
| Bitget | ✅ 작동 | 글로벌 USDT | 직접 |
| Gate.io | ✅ 작동 | 글로벌 USDT | 직접 |
| HTX | ✅ 작동 | 글로벌 USDT | 직접 |
| MEXC | ✅ 작동 | 글로벌 USDT | 직접 |

### BTC 피벗 Fallback 순서
```
BINANCE → OKX → BITGET → GATE → MEXC
```

---

## 🛠️ API 엔드포인트 정리

### 1️⃣ `/api/premium/table-filtered` (프리미엄 테이블)
```typescript
GET /api/premium/table-filtered?domestic=UPBIT_KRW&foreign=BINANCE_USDT
응답:
{
  success: true,
  data: [...],
  averagePremium: 3.45,
  fxRate: 1465.36,
  totalCoins: 200,
  listedCoins: 185
}
```
- ✅ 기본 해외거래소: BINANCE_USDT
- ✅ prices.json 기반 실시간 가격
- ✅ BTC 피벗 fallback 로직

### 2️⃣ `/api/global-metrics` (글로벌 메트릭)
```typescript
응답:
{
  fx: { usdKrw: 1465, change24h: 0 },
  usdt: { krw: 1487, change24h: -0.07 },
  global: {
    btcDominance: 42.3,
    marketCapKrw: 4.787e15,
    volume24hKrw: 2.38e14
  },
  concurrentUsers: 42
}
```

### 3️⃣ `/api/heartbeat` (세션 추적)
```typescript
POST /api/heartbeat
요청: { sessionId: "uuid" }
응답: { ok: true }
```

---

## 📂 코드 구조

```
/
├── workers/
│   ├── priceWorker.ts              ← 3초 가격 수집 cron
│   └── fetchers/
│       ├── index.ts                ← 모든 fetcher 통합
│       ├── upbit.ts
│       ├── bithumb.ts
│       ├── coinone.ts
│       ├── binance.ts              ← 프록시 사용
│       └── globalExchanges.ts      ← OKX, Bybit(프록시), Bitget, Gate, HTX, MEXC
├── proxy-server-render/
│   └── index.js                    ← Render 배포용 프록시 서버
├── data/
│   ├── prices.json                 ← 4,507 가격 엔트리
│   ├── premiumTable.json           ← 558 프리미엄 행
│   ├── exchange_markets.json       ← 거래소별 마켓 정보
│   └── master_symbols.json         ← 심볼 마스터 (이름, 아이콘)
├── scripts/
│   ├── syncCmcSlugs.ts             ← CoinMarketCap 슬러그 동기화
│   └── buildMasterSymbols.ts       ← 마스터 심볼 빌드
├── server.ts                       ← priceWorker 시작
├── src/
│   ├── lib/
│   │   ├── sessionCache.ts         ← 메모리 기반 세션 추적
│   │   └── coinMarketCapUtils.ts   ← CMC 슬러그 매핑
│   ├── contexts/
│   │   └── ExchangeSelectionContext.tsx ← 거래소 선택 컨텍스트
│   ├── pages/api/
│   │   ├── premium/
│   │   │   └── table-filtered.ts   ← 프리미엄 API
│   │   ├── proxy/
│   │   │   └── binance.ts          ← 내부 Binance 프록시
│   │   ├── global-metrics.ts
│   │   ├── heartbeat.ts
│   │   └── auth/                   ← Supabase Auth
│   └── components/
│       └── PremiumTable.tsx
└── public/
    └── icons/                      ← 코인 아이콘 (거래소별)
```

---

## 💾 데이터 상태

### prices.json
- 총 4,507개 가격 엔트리 (+1,013 증가)
- 형식: `EXCHANGE:SYMBOL:QUOTE` → `{ price, ts }`
- 예: `"BINANCE:BTC:USDT": { price: 93283.57, ts: 1764845xxx }`

### premiumTable.json
- 총 558개 프리미엄 행
- 포함: symbol, name_ko, name_en, premium, koreanPrice, globalPrice, usdKrw, cmcSlug

### CMC 슬러그 매핑
- 483/564 코인 매핑 완료 (85.6%)
- 81개 마이너 토큰 미매핑 (수동 추가 가능)

---

## 📝 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Axios
- **프록시 서버**: Render (Node.js/Express)
- **실시간 가격**:
  - Upbit, Bithumb, Coinone (한국 - 직접)
  - Binance, Bybit (글로벌 - 프록시)
  - OKX, Bitget, Gate, HTX, MEXC (글로벌 - 직접)
- **글로벌 메트릭**: CoinGecko API
- **환율**: Bithumb USDT/KRW
- **세션 추적**: 메모리 Map
- **DB**: Supabase (Auth + 유저 데이터만)
- **Deployment**: Replit

---

## 🚀 배포 준비 상태

- ✅ 실시간 가격 수집 완료 (3초 갱신, 4,507 entries)
- ✅ 프리미엄 계산 완료 (558 rows)
- ✅ 프록시 서버 통합 (Binance/Bybit 지역제한 해결)
- ✅ 프론트엔드 기본 거래소: BINANCE_USDT
- ✅ in-progress 락으로 중첩 방지
- ✅ CMC 슬러그 85.6% 매핑
- ⏳ 프론트엔드 UI 완성 (진행중)

---

## 🔄 알려진 이슈

1. **Binance/Bybit 지역제한** (451/403 에러)
   - ✅ 해결: Render 프록시 서버 사용
   - 모든 직접 호출 제거됨

2. **일부 아이콘 누락** (FCT2, GAME2, MET2 등)
   - 해결: BAD_ICON_SYMBOLS에 추가하여 placeholder 표시

3. **CMC 슬러그 미매핑** (81개 마이너 토큰)
   - 해결: 수동 override map 또는 무시

---

## 📌 v3.3.2 변경사항 (2025-12-04)

1. **Rate Limit 해결을 위한 Worker 분리**
   - 가격 수집 Worker: 3초 간격 (기존 유지)
   - 통계 수집 Worker: 30초 간격 (신규 분리)
   - Binance API 호출 횟수 대폭 감소 (분당 2400 → ~120)

2. **프록시 서버 캐싱 강화**
   - 가격 API: 2초 캐시 TTL
   - 24hr 통계 API: 30초 캐시 TTL
   - `/binance/api/v3/ticker/24hr` 엔드포인트 추가

3. **주요 수치**
   - 가격 수집: 4,507 entries
   - 통계 수집: 3,366 stats
   - 프리미엄 테이블: 558 rows

## 📌 v3.3.1 변경사항 (2025-12-04)

1. **프록시 전환 완료**
   - Binance Spot/Futures → Render 프록시
   - Bybit Spot → Render 프록시 (category=spot 고정)

2. **프론트엔드 기본 거래소 변경**
   - 기존: `BINANCE_BTC` (BTC 마켓)
   - 변경: `BINANCE_USDT` (USDT 마켓)

3. **가격 엔트리 증가**
   - 3,494 → 4,507 (+1,013개, 29% 증가)
