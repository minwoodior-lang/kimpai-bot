import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[AdminAuth] JWT_SECRET not set, using fallback for development only');
}
const SECRET = JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
const COOKIE_NAME = 'kimpai_admin_session';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export interface AdminSession {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export function signToken(payload: { userId: string; username: string; role: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AdminSession | null {
  try {
    return jwt.verify(token, SECRET) as AdminSession;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextApiRequest): AdminSession | null {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: NextApiResponse, token: string): void {
  const secureFlag = IS_PRODUCTION ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${60 * 60 * 24}`,
  ]);
}

export function clearSessionCookie(res: NextApiResponse): void {
  const secureFlag = IS_PRODUCTION ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`,
  ]);
}

export type AdminApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: AdminSession
) => Promise<void> | void;

export function withAdminAuth(handler: AdminApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = getSessionFromRequest(req);
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    return handler(req, res, session);
  };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
