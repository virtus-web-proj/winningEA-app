import 'dotenv/config';
import { db } from '../src/db.js';
import { hashPassword } from '../src/password.js';

const [ident, pw] = process.argv.slice(2);
if (!ident || !pw || pw.length < 8) { console.error('Usage: node scripts/set-password.js <email-or-username> <new password, 8+ chars>'); process.exit(1); }
const u = db.prepare('SELECT id, email FROM users WHERE email = ? OR username = ? COLLATE NOCASE OR legacy_login = ? COLLATE NOCASE').get(ident, ident, ident);
if (!u) { console.error('No such member'); process.exit(1); }
db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(hashPassword(pw), u.id);
console.log(`Password updated for ${u.email}`);
