// Import WordPress members.
//   npm run import-wp -- users.csv --dry-run     (preview, writes nothing)
//   npm run import-wp -- users.csv               (import)
// File: CSV (or JSON array) with columns  ID, user_login, user_email, user_pass, display_name, user_registered
// Export with WP-CLI:  wp user list --fields=ID,user_login,user_email,user_pass,display_name,user_registered --format=csv > users.csv
// Passwords are NOT converted: the WordPress hash is kept and verified at login, then upgraded to bcrypt automatically.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { db } from '../src/db.js';
import { isSupportedHash } from '../src/password.js';

const [file, ...flags] = process.argv.slice(2);
const dry = flags.includes('--dry-run');
if (!file) { console.error('Usage: npm run import-wp -- <users.csv|users.json> [--dry-run]'); process.exit(1); }

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const t = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((x) => x !== '')) rows.push(row); row = []; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map((h) => h.trim().toLowerCase());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const raw = readFileSync(file, 'utf8');
const records = (raw.trim().startsWith('[') ? JSON.parse(raw) : parseCsv(raw)).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase(), typeof v === 'string' ? v.trim() : v])));
const pick = (r, ...keys) => { for (const k of keys) if (r[k]) return String(r[k]); return ''; };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const stats = { created: 0, skippedExisting: 0, skippedInvalid: 0, skippedHash: 0, memberNoReassigned: 0 };
const problems = [];

const insert = db.prepare('INSERT INTO users (member_no, name, email, password_hash, legacy_login, created_at) VALUES (?,?,?,?,?,?)');
const freeNo = () => { for (;;) { const n = String(randomInt(1000000, 9999999)); if (!db.prepare('SELECT 1 FROM users WHERE member_no = ?').get(n)) return n; } };

db.exec('BEGIN');
try {
  for (const r of records) {
    const email = pick(r, 'user_email', 'email').toLowerCase();
    const hash = pick(r, 'user_pass', 'password', 'password_hash');
    const login = pick(r, 'user_login', 'login', 'username');
    const id = pick(r, 'id');
    if (!EMAIL_RE.test(email)) { stats.skippedInvalid++; problems.push(`invalid email: ${email || '(empty)'} [ID ${id}]`); continue; }
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) { stats.skippedExisting++; continue; }
    if (!isSupportedHash(hash)) { stats.skippedHash++; problems.push(`unsupported/missing password hash: ${email} (reset their password from the admin screen)`); continue; }
    // The old site's 会員NO. was the WordPress user ID: keep it, because members quote it in bank transfers.
    let memberNo = /^\d{1,12}$/.test(id) ? id : '';
    if (!memberNo || db.prepare('SELECT 1 FROM users WHERE member_no = ?').get(memberNo)) { memberNo = freeNo(); stats.memberNoReassigned++; problems.push(`member no reassigned for ${email} (ID ${id || 'none'} unavailable) -> ${memberNo}`); }
    const registered = pick(r, 'user_registered', 'registered');
    const created = /^\d{4}-\d{2}-\d{2}/.test(registered) ? registered.slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
    insert.run(memberNo, pick(r, 'display_name', 'name') || login || email, email, hash, login && login.toLowerCase() !== email ? login : null, created);
    stats.created++;
  }
  if (dry) db.exec('ROLLBACK'); else db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Import failed, nothing was written:', e.message);
  process.exit(1);
}

console.log(`${dry ? '[DRY RUN – nothing written] ' : ''}Read ${records.length} rows`);
console.log(stats);
if (problems.length) { console.log('\nNeeds attention:'); problems.slice(0, 100).forEach((p) => console.log(' -', p)); if (problems.length > 100) console.log(` … and ${problems.length - 100} more`); }
