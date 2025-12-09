const locks = new Map();

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

module.exports = { setLock, hasLock, clearAllLocks };
