#!/bin/bash
# 프로덕션 데이터베이스 admin 계정 초기화 스크립트

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL이 설정되지 않았습니다"
  exit 1
fi

echo "🔧 프로덕션 데이터베이스에 admin 계정 초기화 중..."

psql "$DATABASE_URL" << 'EOF'
-- admin 계정 초기화
DELETE FROM admin_users WHERE username = 'admin';
INSERT INTO admin_users (id, username, password_hash, role, created_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$e1AoZc3SKLQmgPdGDB3QAeNGmdEIZQxSAYoiAB0yQymCZRI/8JtvW',
  'admin',
  NOW()
);

-- 확인
SELECT '✅ Admin account initialized:' as result, username, role FROM admin_users WHERE username = 'admin';
EOF

echo "✅ 프로덕션 데이터베이스 초기화 완료"
