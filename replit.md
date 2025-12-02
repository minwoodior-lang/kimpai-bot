# KimpAI - Kimchi Premium Analytics Dashboard

## 📋 상태: 코인 심볼/마켓 구조 구축 (Phase 2)

### 현재 진행 상황 (2025-12-02)

**✅ 완료된 것:**
- 로컬 JSON 기반 데이터 구조 전환 (Supabase 의존도 제거)
- 3개 거래소 마켓 데이터 수집 (API)
  - Upbit: 664개 마켓 + 한글/영문명 ✓
  - Bithumb: 439개 마켓 + 한글/영문명 ✓
  - Coinone: 390개 마켓 (name은 비어있음)
- 최종 통합 파일: `data/exchange_markets.json` (1,103개 마켓)
- 폴더 구조: `data/raw/{upbit,bithumb,coinone}/markets.json`

**⚠️ 진행 중:**
- TradingView 위젯 JSON 설정 수정 (재시작 대기)

**📂 로컬 데이터 아키텍처**

```
data/
├── raw/
│   ├── upbit/
│   │   └── markets.json        (664개)
│   ├── bithumb/
│   │   ├── markets.json        (439개)
│   │   └── names.json          (한글/영문명)
│   └── coinone/
│       ├── markets.json        (390개)
│       └── names.json          (비어있음)
├── exchange_markets.json       (1,103개 통합)
├── premiumTable.json           (생성 대기)
├── master_symbols.json         (생성 대기)
└── symbolIcons.json            (생성 대기)
```

**📊 최종 exchange_markets.json 구조**

```json
{
  "id": "BITHUMB:0G-KRW",
  "exchange": "BITHUMB",
  "market": "0G-KRW",
  "base": "0G",
  "quote": "KRW",
  "name_ko": "...",
  "name_en": "...",
  "isDomestic": true
}
```

## 🔄 다음 단계

1. **Coinone name_ko/name_en 자동 크롤링** (고객센터 HTML)
2. **프리미엄 테이블 생성** (priceWorker 업데이트)
3. **API 엔드포인트 업데이트** (`/api/premium/table`)
4. **TradingView 위젯 에러 최종 확인**

## 🛠️ 사용 가능한 npm 스크립트

```bash
npm run fetch:upbit      # Upbit 마켓 수집
npm run fetch:bithumb    # Bithumb 마켓 수집
npm run fetch:coinone    # Coinone 마켓 수집
npm run build:markets    # 모든 마켓 병합
npm run dev              # 개발 서버 실행
```

## 💾 Supabase 사용 범위 (축소됨)

- `users` 테이블 (회원 관리)
- `alerts` 테이블 (알림 설정)
- `notices` 테이블 (공지사항)

**메타데이터 & 가격 데이터: 로컬 JSON** ✓

## 📝 기술 스택

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Axios
- **Data**: Local JSON (data/ folder)
- **Deployment**: Replit
