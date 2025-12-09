# KimpAI Telegram Bot v1.0

KimpAI의 실시간 김프 분석 및 AI 기반 암호화폐 트레이딩 신호를 Telegram으로 전송하는 봇입니다.

## 📦 설치 및 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하여 아래 정보를 추가하세요:

```env
# Telegram Bot Token (BotFather에서 발급)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 공식 채널 ID (FREE 알림 수신)
TELEGRAM_CHANNEL_ID=your_channel_id_here

# Supabase (사용자 데이터 저장)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# API 서버
API_URL=http://localhost:5000
```

### 2. Supabase 테이블 생성

Supabase 대시보드의 SQL 에디터에서 `src/bot/schema.sql`의 내용을 실행하세요.

### 3. 봇 실행

```bash
# 개발 모드
npm run bot:dev

# 프로덕션 모드
npm run bot:start
```

## 🎮 명령어

### FREE 명령어 (무료)

| 명령어 | 설명 |
|--------|------|
| `/start` | 봇 안내 메시지 |
| `/btc` | BTC 김프 변화 감지 |
| `/eth` | ETH 변동성 증가 신호 |
| `/alt {symbol}` | ALT 종목 단기 분석 |
| `/watchlist` | 관심종목 확인 |
| `/add_watchlist {symbol}` | 관심종목 추가 |
| `/remove_watchlist {symbol}` | 관심종목 제거 |

### PRO 명령어 (구독 필요)

| 명령어 | 설명 |
|--------|------|
| `/pro_btc` | BTC 48시간 예측 리포트 |
| `/pro_whale {symbol}` | 고래 매집 포착 |
| `/pro_risk {symbol}` | 과열·폭락 리스크 경고 |

## 🔄 자동 스캔

### FREE 자동 전송 (공식 채널)

- **10분마다**: TOP 50 ALT 변동성 급등 감지
- **30분마다**: BTC 김프 변화 감지

### PRO 자동 전송 (개인 DM)

- **5분마다**: 사용자 관심종목 고래 매집 감지
- **6시간마다**: BTC 48시간 예측 리포트

## 📁 파일 구조

```
src/bot/
├── index.js                 # 메인 봇 파일
├── utils/
│   ├── messages.js         # 메시지 템플릿
│   └── supabase.js         # Supabase 유틸
├── commands/
│   ├── free.js             # FREE 명령어들
│   └── pro.js              # PRO 명령어들
├── schedulers/
│   ├── freeScan.js         # FREE 자동 스캔
│   └── proScan.js          # PRO 자동 스캔
└── schema.sql              # Supabase 스키마

src/pages/api/bot/          # API 엔드포인트
├── btc.ts
├── eth.ts
├── alts.ts
├── alts/[symbol].ts
├── pro/
│   ├── btc.ts
│   ├── whale/[symbol].ts
│   └── risk/[symbol].ts
```

## 🔗 API 엔드포인트

### FREE API

- `GET /api/bot/btc` - BTC 김프 데이터
- `GET /api/bot/eth` - ETH 변동성 데이터
- `GET /api/bot/alts?limit=50` - TOP 50 ALT 목록
- `GET /api/bot/alts/{symbol}` - 특정 ALT 데이터

### PRO API

- `GET /api/bot/pro/btc` - BTC 48시간 예측
- `GET /api/bot/pro/whale/{symbol}` - 고래 매집 데이터
- `GET /api/bot/pro/risk/{symbol}` - 리스크 분석

## 🚀 배포

### Replit에서 프로덕션 배포

1. 환경 변수를 Replit Secrets에 등록
2. `deploy_config.json` 에서 아래 설정:

```json
{
  "deployment_target": "vm",
  "run": ["npm", "run", "bot:start"],
  "build": ["npm", "run", "build"]
}
```

3. Publish 버튼으로 배포

## 📊 메시지 형식

모든 메시지는 다음 구조를 따릅니다:

```
[제목] 주요 지표
— 변화율
— 현재값
— 추세

🧠 AI 해석:
[한줄 분석]

🔍 참고/전략:
[과거 패턴 확률 또는 전략]
```

## 🔒 PRO 기능 보호

PRO 명령어는 자동으로 다음 메시지를 추가합니다:

```
🔒 PRO 전용 기능입니다.
자세히 보기: https://kimpai.io
```

## 🐛 트러블슈팅

### 봇이 응답하지 않음

- `TELEGRAM_BOT_TOKEN` 확인
- BotFather에서 발급한 토큰 재확인

### 채널 메시지가 전송되지 않음

- `TELEGRAM_CHANNEL_ID` 확인
- 봇이 채널의 관리자인지 확인
- 채널이 비공개인 경우 `-1001234567890` 형식 사용

### Supabase 연결 실패

- `SUPABASE_URL`, `SUPABASE_KEY` 확인
- SQL 에디터에서 `telegram_users` 테이블 생성 확인

## 📈 추후 개선 사항

- [ ] 사용자 PRO 구독 자동 결제
- [ ] 더 정교한 AI 분석 모델
- [ ] 백테스팅 시스템
- [ ] 웹대시보드 통합
- [ ] 알림 빈도 커스터마이징

## 📞 지원

문제가 있으면 https://kimpai.io 를 방문하세요.

---

**마지막 업데이트**: 2025-12-09
