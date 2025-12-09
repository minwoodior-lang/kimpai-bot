# 🚀 KimpAI Telegram Bot 빠른 시작 가이드

## 5분 안에 시작하기

### ✅ 이미 완료된 것
- ✅ Node.js + Telegraf.js 설치
- ✅ 10개 명령어 코드 작성 (FREE 7개 + PRO 3개)
- ✅ 4개 자동 스캔 스케줄러 구현
- ✅ 7개 API 엔드포인트 구축
- ✅ Supabase 스키마 준비
- ✅ 메시지 템플릿 (6가지) 작성

### ❌ 아직 필요한 것 (3가지)

#### 1️⃣ Telegram Bot Token 받기
```bash
Telegram에서 @BotFather 찾기
→ /newbot 명령어
→ 봇 이름 & 사용자명 입력
→ 토큰 받기 (TELEGRAM_BOT_TOKEN)
```

#### 2️⃣ Telegram 채널 만들기
```bash
새로운 채널 생성
→ 봇을 관리자로 추가
→ 채널 ID 확인 (TELEGRAM_CHANNEL_ID)
```

#### 3️⃣ Replit Secrets에 등록
```bash
이미 등록됨:
✅ TELEGRAM_BOT_TOKEN
✅ SUPABASE_URL
✅ SUPABASE_KEY

아직 필요:
⏳ TELEGRAM_CHANNEL_ID (환경변수로 추가 필요)
```

### 🎯 채널 ID 찾는 방법

**가장 쉬운 방법:**
1. Telegram에서 **@userinfobot** 찾기
2. 채널에 이 봇 추가
3. 채널에 메시지 발송
4. 봇에게 `/start` 실행
5. 표시되는 Channel ID 복사 (음수)

**또는** 채널 링크에서:
```
https://t.me/c/1001234567890 → CHANNEL_ID = -1001234567890
```

### 📝 환경변수 설정 (Replit Secrets)

Replit Secrets 탭에서 아래 4개 추가:

```
TELEGRAM_BOT_TOKEN = [BotFather에서 받은 토큰]
TELEGRAM_CHANNEL_ID = -[채널 ID] (음수!)
SUPABASE_URL = [이미 등록됨]
SUPABASE_KEY = [이미 등록됨]
```

### 🏃 봇 실행

```bash
# 개발 모드 (테스트)
npm run bot:dev

# 프로덕션 (배포)
npm run bot:start
```

### 🧪 봇 테스트

Telegram에서 봇과 대화:

```
/start                      # 명령어 목록
/btc                        # BTC 김프 감지
/eth                        # ETH 변동성
/alt BTC                    # BTC 분석
/add_watchlist SUI          # 관심종목 추가
/watchlist                  # 관심종목 확인
/pro_btc                    # PRO: BTC 예측
```

### 📊 채널 알림 확인

봇이 자동으로 채널에 메시지 전송:
- **10분마다**: TOP 50 알트 변동성
- **30분마다**: BTC 김프 변화

### ✨ 완료!

이제 KimpAI Telegram Bot이 완전히 작동합니다.

---

**문제 발생?**
- `BOT_README.md` - 상세 설명서
- `TEST_COMMANDS.md` - 테스트 명령어
- `TELEGRAM_BOT_SETUP.md` - 초기 설정 가이드
- `IMPLEMENTATION_SUMMARY.md` - 기술 명세

TELEGRAM_CHANNEL_ID를 설정한 후 테스트해주세요!
