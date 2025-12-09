# Telegram 채널 ID 찾기 가이드

Bot이 메시지를 보낼 채널의 ID를 찾는 방법입니다.

## 방법 1: 임시 봇을 이용한 ID 조회 (권장)

1. Telegram에서 **@userinfobot** 검색
2. `/start` 메시지
3. 봇이 당신의 Chat ID 표시
4. 원하는 채널에 이 봇을 추가
5. 채널에 아무 메시지나 발송
6. 봇에게 `/start` 다시 실행
7. 채널 정보 확인 (Channel ID는 음수)

## 방법 2: 채널 링크에서 확인

1. Telegram에서 채널 링크 확인: `https://t.me/c/{ID}`
2. 예: `https://t.me/c/1001234567890`
3. Replit에 등록: `-1001234567890` (음수로)

## 방법 3: Bot 명령어 실행

채널 설정 후:

```bash
curl -X GET "https://api.telegram.org/bot{BOT_TOKEN}/getMe"
```

그리고 채널에 메시지 보낸 후:

```bash
curl -X GET "https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
```

응답에서 `channel_post.chat.id` 찾기

## 올바른 형식

- **개인 채팅**: `123456789` (양수)
- **그룹/채널**: `-100123456789` (음수, 100으로 시작)

예제:
```
TELEGRAM_CHANNEL_ID=-1001234567890
```

## 확인 방법

봇에서 다음 명령어 실행:

```bash
telegram.sendMessage(TELEGRAM_CHANNEL_ID, "테스트 메시지");
```

메시지가 채널에 나타나면 성공!
