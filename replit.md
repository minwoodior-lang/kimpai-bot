# KimpAI v3.3.0 - Kimchi Premium Analytics Dashboard

## 📋 상태: 실시간 가격 수집 시스템 완료 (Phase 5 ✅)

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
- 💹 가격 데이터 (prices.json - 3,494 entries)
- 👥 동시접속자 추적 (메모리 Map)
- 🔄 세션 관리 (heartbeat)

→ 실시간/임시 데이터는 Replit 서버에서만 처리 (Supabase 제거)

---

## 🔥 실시간 가격 수집 시스템

### priceWorker (3초 갱신)
```
workers/priceWorker.ts
├── 3초마다 모든 거래소 API 호출
├── prices.json 저장 (3,494 entries)
├── premiumTable.json 계산 (556 rows)
└── in-progress 락으로 중첩 방지
```

### 지원 거래소
| 거래소 | 상태 | 타입 |
|--------|------|------|
| Upbit | ✅ 작동 | 한국 KRW |
| Bithumb | ✅ 작동 | 한국 KRW |
| Coinone | ✅ 작동 | 한국 KRW |
| Binance | ⚠️ 지역제한 | 글로벌 USDT |
| OKX | ✅ 작동 (기본) | 글로벌 USDT |
| Bybit | ⚠️ 지역제한 | 글로벌 USDT |
| Bitget | ✅ 작동 | 글로벌 USDT |
| Gate.io | ✅ 작동 | 글로벌 USDT |
| HTX | ✅ 작동 | 글로벌 USDT |
| MEXC | ✅ 작동 | 글로벌 USDT |

### BTC 피벗 Fallback 순서
```
BINANCE → OKX → BITGET → GATE → MEXC
```

---

## 🛠️ API 엔드포인트 정리

### 1️⃣ `/api/premium/table-filtered` (프리미엄 테이블)
```typescript
GET /api/premium/table-filtered?domestic=UPBIT_KRW&foreign=OKX_USDT
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
- ✅ 기본 해외거래소: OKX_USDT (Binance 지역제한 대응)
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
│       ├── binance.ts
│       └── globalExchanges.ts      ← OKX, Bitget, Gate, HTX, MEXC
├── data/
│   ├── prices.json                 ← 3,494 가격 엔트리
│   ├── premiumTable.json           ← 556 프리미엄 행
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
│   ├── pages/api/
│   │   ├── premium/
│   │   │   └── table-filtered.ts   ← 프리미엄 API
│   │   ├── global-metrics.ts
│   │   ├── heartbeat.ts
│   │   └── auth/                   ← Supabase Auth
│   └── components/
│       └── premium/
│           └── PremiumTable.tsx
└── public/
    └── icons/                      ← 코인 아이콘 (거래소별)
```

---

## 💾 데이터 상태

### prices.json
- 총 3,494개 가격 엔트리
- 형식: `EXCHANGE:SYMBOL:QUOTE` → `{ price, ts }`
- 예: `"OKX:BTC:USDT": { price: 97500.5, ts: 1733xxx }`

### premiumTable.json
- 총 556개 프리미엄 행
- 포함: symbol, name_ko, name_en, premium, koreanPrice, globalPrice, usdKrw, cmcSlug

### CMC 슬러그 매핑
- 483/564 코인 매핑 완료 (85.6%)
- 81개 마이너 토큰 미매핑 (수동 추가 가능)

---

## 📝 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Axios
- **실시간 가격**:
  - Upbit, Bithumb, Coinone (한국)
  - OKX, Bitget, Gate, HTX, MEXC (글로벌)
- **글로벌 메트릭**: CoinGecko API
- **환율**: Bithumb USDT/KRW
- **세션 추적**: 메모리 Map
- **DB**: Supabase (Auth + 유저 데이터만)
- **Deployment**: Replit

---

## 🚀 배포 준비 상태

- ✅ 실시간 가격 수집 완료 (3초 갱신, 3,494 entries)
- ✅ 프리미엄 계산 완료 (556 rows)
- ✅ 거래소 fallback 로직 (Binance/Bybit 지역제한 대응)
- ✅ in-progress 락으로 중첩 방지
- ✅ CMC 슬러그 85.6% 매핑
- ⏳ 프론트엔드 UI 완성 (진행중)

---

## 🔄 알려진 이슈

1. **Binance/Bybit 지역제한** (451/403 에러)
   - 해결: OKX를 기본 해외거래소로 설정
   - BTC 피벗에 fallback 순서 추가

2. **일부 아이콘 누락** (FCT2, GAME2, MET2 등)
   - 해결: BAD_ICON_SYMBOLS에 추가하여 placeholder 표시

3. **CMC 슬러그 미매핑** (81개 마이너 토큰)
   - 해결: 수동 override map 또는 무시
