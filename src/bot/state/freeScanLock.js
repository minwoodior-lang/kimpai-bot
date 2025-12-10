const locks = new Map();

function canSend(type, symbol, cooldownMs) {
  const key = `${type}:${symbol}`;
  const now = Date.now();
  const expireAt = locks.get(key);
  if (expireAt && expireAt > now) return false;
  locks.set(key, now + cooldownMs);
  return true;
}

function setLock(key, ttlMs) {
  const expireAt = Date.now() + ttlMs;
  locks.set(key, expireAt);
}

function hasLock(key) {
  const now = Date.now();
  const expireAt = locks.get(key);
  if (!expireAt) return false;
  if (expireAt < now) {
    locks.delete(key);
    return false;
  }
  return true;
}

function clearAllLocks() {
  locks.clear();
}

function getLastAlertTime(type, symbol) {
  const key = `${type}:${symbol}:lastTime`;
  return locks.get(key) || null;
}

function setLastAlertTime(type, symbol) {
  const key = `${type}:${symbol}:lastTime`;
  locks.set(key, Date.now());
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "최초 감지";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분 전` : `${hours}시간 전`;
}

module.exports = { 
  canSend, 
  setLock, 
  hasLock, 
  clearAllLocks,
  getLastAlertTime,
  setLastAlertTime,
  formatTimeAgo
};
