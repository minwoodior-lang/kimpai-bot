-- KimpAI Telegram Bot 사용자 데이터 스키마

CREATE TABLE IF NOT EXISTS telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  is_pro BOOLEAN DEFAULT FALSE,
  watchlist TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_telegram_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_is_pro ON telegram_users(is_pro);

-- RLS 정책 (필요시)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 데이터만 접근 가능
CREATE POLICY "Users can only access their own data"
  ON telegram_users
  FOR ALL
  USING (telegram_chat_id = current_user_id())
  WITH CHECK (telegram_chat_id = current_user_id());
