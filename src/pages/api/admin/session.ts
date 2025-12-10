import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = getSessionFromRequest(req);
  
  if (!session) {
    return res.status(401).json({ success: false, authenticated: false });
  }

  return res.status(200).json({ 
    success: true, 
    authenticated: true,
    user: {
      username: session.username,
      role: session.role
    }
  });
}
