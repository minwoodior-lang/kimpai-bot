# Telegram Bot 테스트 명령어

봇과 1:1 채팅에서 아래 명령어를 실행하여 테스트할 수 있습니다.

## FREE 명령어 테스트

```
/start                    # 봇 소개 및 사용 가능한 명령어 표시
/btc                      # BTC 김프 변화 감지 리포트
/eth                      # ETH 변동성 증가 신호
/alt BTC                  # BTC 종목 단기 분석
/alt SUI                  # SUI 종목 단기 분석
/alt DOGE                 # DOGE 종목 단기 분석
```

## 관심종목(Watchlist) 테스트

```
/watchlist                # 현재 관심종목 확인
/add_watchlist BTC        # BTC 추가
/add_watchlist SUI        # SUI 추가
/add_watchlist DOGE       # DOGE 추가
/watchlist                # 추가된 종목 확인
/remove_watchlist SUI     # SUI 제거
```

## PRO 명령어 테스트 (PRO 사용자만)

```
/pro_btc                  # BTC 48시간 예측 리포트
/pro_whale BTC            # BTC 고래 매집 포착
/pro_whale SUI            # SUI 고래 매집 포착
/pro_risk BTC             # BTC 과열·폭락 리스크
/pro_risk DOGE            # DOGE 과열·폭락 리스크
```

## 예상 응답 형식

### /btc 응답
```
📈 [KimpAI] BTC 김치 프리미엄 변화 감지

— 지난 10분 변동: -1.23% → 0.56%
— 현재 김프: 0.56%
— 국내 가격이 해외보다 높음

🧠 AI 해석:
현재 추세상 상승세가 강함

🔍 참고:
과거 동일 패턴 발생 시 75% 확률로 2.34% 추가 변동이 발생했습니다.
```

### /pro_whale {symbol} 응답
```
🔒 [KimpAI PRO] 고래 매집 포착 — BTC

— 순입금: 450 BTC
— 평균 매수: $42,500
— 매집 지속: 2-3시간

🧠 결론:
고래 매집 활동 포착됨

📌 확률:
상승 확률 82%
변동 예상 2.34%
```

## 자동 알림 확인

봇이 다음 시간대에 공식 채널로 자동 알림을 발송합니다:

- **10분마다**: TOP 50 ALT 변동성 급등 감지
- **30분마다**: BTC 김프 변화 감지
- **5분마다** (PRO): 사용자 관심종목 고래 매집 감지
- **6시간마다** (PRO): BTC 48시간 예측

## 트러블슈팅

| 문제 | 해결방법 |
|------|----------|
| 봇이 응답 안 함 | BotFather에서 토큰 재확인, 봇 재시작 |
| 채널 알림 없음 | TELEGRAM_CHANNEL_ID 확인, 봇이 관리자인지 확인 |
| API 오류 | http://localhost:5000 서버 실행 확인 |
| Supabase 연결 실패 | SQL 에디터에서 telegram_users 테이블 존재 확인 |
