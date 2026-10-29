import bcrypt from 'bcryptjs';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const md5 = (b) => createHash('md5').update(b).digest();
const safeEq = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function encode64(input, count) {
  let out = '';
  let i = 0;
  do {
    let v = input[i++];
    out += ITOA64[v & 0x3f];
    if (i < count) v |= input[i] << 8;
    out += ITOA64[(v >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) v |= input[i] << 16;
    out += ITOA64[(v >> 12) & 0x3f];
    if (i++ >= count) break;
    out += ITOA64[(v >> 18) & 0x3f];
  } while (i < count);
  return out;
}

// WordPress "portable" phpass hash ($P$ / $H$), used by WordPress before 6.8.
function phpassVerify(plain, stored) {
  if (stored.length !== 34) return false;
  const log2 = ITOA64.indexOf(stored[3]);
  if (log2 < 7 || log2 > 30) return false;
  let count = 1 << log2;
  const salt = stored.slice(4, 12);
  const pw = Buffer.from(plain, 'utf8');
  let hash = md5(Buffer.concat([Buffer.from(salt), pw]));
  do { hash = md5(Buffer.concat([hash, pw])); } while (--count);
  return safeEq(stored.slice(0, 12) + encode64(hash, 16), stored);
}

// WordPress 6.8+ : "$wp" + bcrypt(base64(HMAC-SHA384(password, "wp-sha384")))
function wpBcryptVerify(plain, stored) {
  const pre = createHmac('sha384', 'wp-sha384').update(plain, 'utf8').digest('base64');
  return bcrypt.compareSync(pre, stored.slice(3));
}

export const hashPassword = (plain) => bcrypt.hashSync(plain, 11);

/** Returns { ok, legacy }. legacy=true means the stored hash is a WordPress one and should be upgraded. */
export function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || !stored) return { ok: false, legacy: false };
  try {
    if (stored.startsWith('$2')) return { ok: bcrypt.compareSync(plain, stored), legacy: false };
    if (stored.startsWith('$wp$2')) return { ok: wpBcryptVerify(plain, stored), legacy: true };
    if (stored.startsWith('$P$') || stored.startsWith('$H$')) return { ok: phpassVerify(plain, stored), legacy: true };
    if (/^[a-f0-9]{32}$/i.test(stored)) return { ok: safeEq(md5(Buffer.from(plain, 'utf8')).toString('hex'), stored.toLowerCase()), legacy: true };
  } catch { /* fall through */ }
  return { ok: false, legacy: false };
}

export const isSupportedHash = (h) => typeof h === 'string' && (h.startsWith('$2') || h.startsWith('$wp$2') || h.startsWith('$P$') || h.startsWith('$H$') || /^[a-f0-9]{32}$/i.test(h));
