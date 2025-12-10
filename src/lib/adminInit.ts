import { Pool } from 'pg';

/**
 * 프로덕션 데이터베이스에 admin 계정 자동 초기화
 * 배포 후 첫 시작 시 한 번만 실행
 */
export async function initProductionAdmin() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    console.log('[AdminInit] Skipped (development environment)');
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[AdminInit] ❌ DATABASE_URL not set');
    return;
  }

  try {
    const pool = new Pool({ connectionString: databaseUrl });
    
    // 비밀번호: admin / 284800
    const ADMIN_HASH = '$2b$10$e1AoZc3SKLQmgPdGDB3QAeNGmdEIZQxSAYoiAB0yQymCZRI/8JtvW';
    
    const result = await pool.query(
      `INSERT INTO admin_users (id, username, password_hash, role, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT (username) DO UPDATE SET
         password_hash = EXCLUDED.password_hash
       RETURNING username, role`,
      ['admin', ADMIN_HASH, 'admin']
    );

    if (result.rows.length > 0) {
      console.log(`[AdminInit] ✅ Admin account ready: ${result.rows[0].username} (${result.rows[0].role})`);
    }
    
    await pool.end();
  } catch (err: any) {
    console.error('[AdminInit] Error:', err.message);
  }
}
