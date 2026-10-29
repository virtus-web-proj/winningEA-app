import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { permsFor } from './permissions.js';

const isProd = process.env.NODE_ENV === 'production';
const configuredSecret = process.env.JWT_SECRET || '';
const weakSecrets = new Set(['change-me', 'replace-me', 'dev-only-secret']);
if (isProd && (configuredSecret.length < 32 || weakSecrets.has(configuredSecret))) {
  throw new Error('JWT_SECRET must be a unique random string of at least 32 characters in production');
}
export const JWT_SECRET = configuredSecret || 'dev-only-secret';
const JWT_ALGORITHM = 'HS256';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/i;
export const bad = (res, code, status = 400) => res.status(status).json({ error: code });
export const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const sign = (u) => jwt.sign({ sub: u.id, ver: u.token_version ?? 0 }, JWT_SECRET, { algorithm: JWT_ALGORITHM, expiresIn: '30d' });
export const publicUser = (u) => ({
  id: u.id, memberNo: u.member_no, username: u.username || u.legacy_login, name: u.name, email: u.email, avatar: u.avatar,
  familyName: u.family_name, givenName: u.given_name, familyKana: u.family_kana, givenKana: u.given_kana,
  birthYear: u.birth_year, birthMonth: u.birth_month, birthDay: u.birth_day, gender: u.gender,
  postalCode: u.postal_code, prefecture: u.prefecture, city: u.city, addressLine: u.address_line, building: u.building, phone: u.phone,
  occupation: u.occupation, income: u.income, investmentPurpose: u.investment_purpose, fxExperience: u.fx_experience,
  role: u.role, permissions: permsFor(u.role),
});

export function audit(actorId, action, target, detail) {
  db.prepare('INSERT INTO audit_log (actor_id, action, target, detail) VALUES (?,?,?,?)').run(actorId ?? null, action, target ?? null, detail ? JSON.stringify(detail) : null);
}

// Loads the user on every request, so suspensions and role changes take effect immediately.
export function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return bad(res, 'unauthorized', 401);
  try {
    const { sub, ver } = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(sub);
    if (!user) return bad(res, 'unauthorized', 401);
    if (ver !== user.token_version) return bad(res, 'unauthorized', 401);
    if (user.status !== 'active') return bad(res, 'account_suspended', 403);
    req.user = user;
    next();
  } catch {
    bad(res, 'unauthorized', 401);
  }
}

export const requirePerm = (perm) => (req, res, next) => (permsFor(req.user.role).includes(perm) ? next() : bad(res, 'forbidden', 403));
