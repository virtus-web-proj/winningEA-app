// Usage: npm run set-role -- user@example.com admin|staff|member [--force]
import 'dotenv/config';
import { db } from '../src/db.js';

const [email, role, flag] = process.argv.slice(2);
if (!email || !['admin', 'staff', 'member'].includes(role)) {
  console.error('Usage: npm run set-role -- <email> <admin|staff|member> [--force]');
  process.exit(1);
}
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
if (!user) { console.error(`No member with email ${email}`); process.exit(1); }

if (role !== 'member') {
  const other = db.prepare('SELECT email FROM users WHERE role = ? AND id != ?').get(role, user.id);
  if (other && flag !== '--force') {
    console.error(`There is already a ${role} (${other.email}). Demote them first, or re-run with --force to allow more than one.`);
    process.exit(1);
  }
}
db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
db.prepare('INSERT INTO audit_log (actor_id, action, target, detail) VALUES (NULL, ?, ?, ?)').run('role.set', user.member_no, JSON.stringify({ from: user.role, to: role }));
console.log(`${user.email}: ${user.role} -> ${role}`);
