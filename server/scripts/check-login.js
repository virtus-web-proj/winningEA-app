import 'dotenv/config';
import { db } from '../src/db.js';
import { verifyPassword } from '../src/password.js';

const [ident, password] = process.argv.slice(2);
if (!ident) { console.error('Usage: node scripts/check-login.js <email-or-username> [password]'); process.exit(1); }

const u = db.prepare('SELECT * FROM users WHERE email = ? OR username = ? COLLATE NOCASE OR legacy_login = ? COLLATE NOCASE').get(ident, ident, ident);
if (!u) {
    const n = db.prepare('SELECT COUNT(*) n FROM users').get().n;
    console.log(`No member matches "${ident}". The database has ${n} member(s). Known emails/usernames:`);
    for (const r of db.prepare('SELECT email, username, legacy_login FROM users').all()) console.log(` - ${r.email}  (username: ${r.username ?? r.legacy_login ?? 'none'})`);
    process.exit(0);
}
const h = u.password_hash || '';
const kind = h.startsWith('$wp$2') ? 'WordPress 6.8+ (bcrypt)' : h.startsWith('$P$') || h.startsWith('$H$') ? 'WordPress classic (phpass)' : h.startsWith('$2') ? 'new site (bcrypt)' : /^[a-f0-9]{32}$/i.test(h) ? 'old MD5' : 'UNKNOWN';
console.log({ memberNo: u.member_no, email: u.email, username: u.username ?? u.legacy_login, role: u.role, status: u.status, hashType: kind, hashLength: h.length });
if (password !== undefined) console.log(`\nPassword check: ${verifyPassword(password, h).ok ? 'MATCHES' : 'does NOT match'}`);
