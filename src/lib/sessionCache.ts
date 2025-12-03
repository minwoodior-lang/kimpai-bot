// 메모리 기반 동시접속자 추적
interface SessionData {
  id: string;
  lastSeen: number;
}

const sessions = new Map<string, SessionData>();
const SESSION_TIMEOUT = 2 * 60 * 1000; // 2분

export function recordSession(sessionId: string): void {
  sessions.set(sessionId, {
    id: sessionId,
    lastSeen: Date.now(),
  });
}

export function getConcurrentUsers(): number {
  const now = Date.now();
  let activeCount = 0;

  Array.from(sessions.entries()).forEach(([, session]) => {
    if (now - session.lastSeen < SESSION_TIMEOUT) {
      activeCount++;
    } else {
      sessions.delete(session.id);
    }
  });

  return activeCount;
}

export function clearExpiredSessions(): void {
  const now = Date.now();
  Array.from(sessions.entries()).forEach(([id, session]) => {
    if (now - session.lastSeen >= SESSION_TIMEOUT) {
      sessions.delete(id);
    }
  });
}
