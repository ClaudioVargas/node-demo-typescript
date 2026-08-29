// Simple in-memory token blacklist with expiry. Not persistent — use Redis for production.
const blacklist = new Map<string, number>() // token -> expiry timestamp (ms)

export function addTokenToBlacklist(token: string, expSeconds?: number) {
  const now = Date.now()
  const ttl = expSeconds ? expSeconds * 1000 : 60 * 60 * 1000 // default 1h
  blacklist.set(token, now + ttl)
}

export function isTokenBlacklisted(token: string) {
  const exp = blacklist.get(token)
  if (!exp) return false
  if (Date.now() > exp) {
    blacklist.delete(token)
    return false
  }
  return true
}

// optional cleanup
export function cleanupBlacklist() {
  const now = Date.now()
  for (const [t, exp] of blacklist.entries()) {
    if (now > exp) blacklist.delete(t)
  }
}

export default { addTokenToBlacklist, isTokenBlacklisted, cleanupBlacklist }
