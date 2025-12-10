import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { signToken, setSessionCookie } from '@/lib/adminAuth';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: '아이디와 비밀번호를 입력하세요' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipKey = typeof ip === 'string' ? ip : ip[0];
  
  const attempts = loginAttempts.get(ipKey);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = LOCKOUT_DURATION - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      return res.status(429).json({ 
        success: false, 
        error: `로그인 시도가 너무 많습니다. ${Math.ceil(timeLeft / 60000)}분 후 다시 시도하세요` 
      });
    }
    loginAttempts.delete(ipKey);
  }

  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash, role')
      .eq('username', username)
      .single();

    if (error || !user) {
      recordFailedAttempt(ipKey);
      return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      recordFailedAttempt(ipKey);
      return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }

    loginAttempts.delete(ipKey);

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    setSessionCookie(res, token);

    return res.status(200).json({ 
      success: true, 
      user: { username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('[Admin Login] Error:', err);
    return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다' });
  }
}

function recordFailedAttempt(ip: string) {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
}
