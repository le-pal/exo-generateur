import crypto from 'crypto';

const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'];
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const sessions = new Map<string, number>();

if (!ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD non défini — la connexion admin sera toujours refusée.');
}

/** Returns a session token on success, null on wrong password (or no password configured). */
export function login(password: string): string | null {
  if (!ADMIN_PASSWORD) return null;
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function logout(token: string | undefined): void {
  if (token) sessions.delete(token);
}
