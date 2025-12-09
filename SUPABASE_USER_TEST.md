# 📋 Telegram 유저 Supabase 저장 테스트 가이드

## ✅ 구현 변경사항

### 1. supabase.js 업데이트
- **새 함수 추가**: `upsertTelegramUserFromCtx(ctx)`
  - Telegram ctx에서 자동으로 유저 정보 추출
  - `telegram_users` 테이블에 upsert
  - 이미 존재하면 username만 업데이트, 없으면 새로 생성

### 2. /start 명령어 수정
- `/start` 명령어 실행 시 자동으로 유저 정보 저장
- 기존 환영 메시지는 그대로 유지
- 유저 정보 저장은 백그라운드에서 진행

### 3. Watchlist 함수 검증
- ✅ `addWatchlist()` - 관심종목 추가 시 Supabase 연동
- ✅ `removeWatchlist()` - 관심종목 제거 시 Supabase 연동
- ✅ `/add_watchlist` 명령어 - telegram_users에 watchlist 배열 저장
- ✅ `/remove_watchlist` 명령어 - telegram_users에서 watchlist 업데이트

## 🧪 테스트 단계

### Step 1: 서버 시작
```bash
npm run bot:dev
```

예상 로그:
```
✅ Telegram Bot 시작됨
📌 BOT_TOKEN: 123456789:...
📌 CHANNEL_ID: -100...
📌 API_URL: http://localhost:5000
```

### Step 2: Telegram 봇과 대화
Telegram에서 봇에게 `/start` 전송

### Step 3: 콘솔 로그 확인
```
✅ telegram_users upsert success: [CHAT_ID] [USERNAME]
```

예시:
```
✅ telegram_users upsert success: 123456789 john_doe
```

### Step 4: Supabase 대시보드 확인
1. Supabase 접속 → 프로젝트 선택
2. **SQL Editor** 또는 **Table Editor**
3. `telegram_users` 테이블 열기
4. 다음 열 확인:
   - `telegram_chat_id`: 123456789
   - `telegram_username`: john_doe (또는 NULL)
   - `watchlist`: {} (초기 빈 배열)
   - `is_pro`: false
   - `created_at`: 현재 시간
   - `updated_at`: 현재 시간

## ✨ 추가 테스트 (관심종목)

### /add_watchlist 테스트
```bash
# Telegram에서
/add_watchlist BTC
/add_watchlist SUI
/add_watchlist DOGE
```

Supabase `telegram_users` 테이블 확인:
```
watchlist: ["BTC", "SUI", "DOGE"]
```

### /watchlist 테스트
```bash
# Telegram에서
/watchlist
```

봇 응답:
```
📌 내 관심종목:
1. BTC
2. SUI
3. DOGE
```

### /remove_watchlist 테스트
```bash
# Telegram에서
/remove_watchlist SUI
/watchlist
```

Supabase 확인:
```
watchlist: ["BTC", "DOGE"]
```

## 🔍 트러블슈팅

| 문제 | 원인 | 해결방법 |
|------|------|--------|
| 콘솔에 upsert 로그 안 나옴 | Supabase 환경변수 미설정 | `SUPABASE_URL`, `SUPABASE_KEY` 확인 |
| "Failed to upsert telegram user" | 테이블 스키마 오류 | Supabase SQL Editor에서 `src/bot/schema.sql` 재실행 |
| 테이블에 행이 안 생김 | API 권한 부족 | `SUPABASE_KEY`가 Anon Public Key 맞는지 확인 |
| 중복 행 생성 | onConflict 설정 오류 | Supabase 테이블에서 `telegram_chat_id` UNIQUE 확인 |

## 📊 정상 작동 확인 체크리스트

- [ ] `/start` 전송 후 콘솔에 `✅ telegram_users upsert success` 로그 표시
- [ ] Supabase 테이블에 새로운 행 생성됨
- [ ] `telegram_chat_id`와 `telegram_username` 값 확인
- [ ] `/add_watchlist BTC` 후 `watchlist: ["BTC"]` 저장됨
- [ ] `/watchlist` 명령어에서 추가된 종목 표시됨
- [ ] `/remove_watchlist BTC` 후 watchlist 정상 업데이트

## 🎯 완료 기준

```
✅ 유저 /start 시 자동 저장
✅ Supabase telegram_users 테이블에 행 생성
✅ Watchlist 추가/제거 정상 작동
✅ 중복 /start는 기존 행 업데이트만 수행
```

## 📝 로그 예시 (성공)

```
✅ Telegram Bot 시작됨
📌 BOT_TOKEN: 123456789:ABC...
📌 CHANNEL_ID: -100...
📌 API_URL: http://localhost:5000

[사용자가 /start 전송]
✅ telegram_users upsert success: 123456789 john_doe

[사용자가 /add_watchlist BTC 전송]
✅ telegram_users upsert success: 123456789 john_doe
✅ Watchlist BTC 추가됨

[사용자가 /watchlist 전송]
📌 내 관심종목:
1. BTC
```

---

**테스트가 완료되면 다음으로 진행:**
1. 여러 사용자로 테스트 (다른 Telegram 계정)
2. 자동 스캔 기능이 Supabase의 `is_pro` 사용자 필터링 정상 작동 확인
3. PRO 명령어 (`/pro_btc`, `/pro_whale` 등) 테스트

**문제 발생 시:**
- 콘솔 전체 로그 저장
- Supabase SQL 에디터에서 `SELECT * FROM telegram_users;` 실행
- 결과 스크린샷 공유
