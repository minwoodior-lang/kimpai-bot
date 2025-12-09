# KimpAI Telegram Bot 초기 설정 가이드

## 1️⃣ Telegram 봇 생성

1. Telegram에서 **@BotFather** 검색
2. `/newbot` 명령어 실행
3. 봇 이름: `KimpAI` (또는 원하는 이름)
4. 봇 사용자명: `kimpai_bot` (또는 고유한 이름)
5. BotFather로부터 받은 **토큰**을 `TELEGRAM_BOT_TOKEN`에 저장

## 2️⃣ Telegram 채널 생성

1. Telegram에서 새로운 채널 생성 (예: `kimpai_signals`)
2. 봇을 관리자로 추가
3. 채널 ID 확인:
   - 채널에 메시지 발송 테스트
   - API를 통해 채널 ID 조회하거나
   - 채널 링크에서: `https://t.me/c/{CHANNEL_ID}` 형식
   - 예: `https://t.me/c/1001234567890` → `CHANNEL_ID = -1001234567890`

4. `TELEGRAM_CHANNEL_ID` 환경변수에 저장 (음수 포함)

## 3️⃣ Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL 에디터에서 `src/bot/schema.sql` 실행
3. 생성된 `telegram_users` 테이블 확인
4. 프로젝트 설정에서:
   - **Project URL**: `SUPABASE_URL`에 저장
   - **Anon Key**: `SUPABASE_KEY`에 저장

## 4️⃣ 환경변수 등록 (Replit)

Replit Secrets에 아래 정보 추가:

```
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_CHANNEL_ID=-1001234567890
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5️⃣ 봇 실행

### 개발 모드 (로컬 테스트)
```bash
npm run bot:dev
```

### 프로덕션 배포
```bash
npm run bot:start
```

## 6️⃣ 봇 테스트

Telegram에서 봇과 대화:

```
/start                    # 안내 메시지
/btc                      # BTC 김프 감지
/eth                      # ETH 변동성
/alt BTC                  # BTC 분석
/add_watchlist SUI        # 관심종목 추가
/watchlist                # 관심종목 확인
```

## 7️⃣ 채널 자동 알림 확인

- 10분마다 TOP 50 ALT 알림 수신
- 30분마다 BTC 김프 알림 수신

✅ 모든 설정 완료!
