import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { auth, requirePerm, bad, str, audit, EMAIL_RE } from './shared.js';
import { hashPassword } from './password.js';

const r = Router();
r.use(auth);

const PAGE = 20;
const like = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const paging = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  return { page, limit: PAGE, offset: (page - 1) * PAGE };
};
const jsonOr = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

// ---- dashboard numbers (any admin-area role) ----
r.get('/stats', requirePerm('orders:read'), (_req, res) => {
  const n = (sql) => db.prepare(sql).get().n;
  res.json({
    members: n("SELECT COUNT(*) n FROM users WHERE role = 'member'"),
    suspended: n("SELECT COUNT(*) n FROM users WHERE status != 'active'"),
    pendingOrders: n("SELECT COUNT(*) n FROM orders WHERE status = 'awaiting_payment'"),
    paidOrders: n("SELECT COUNT(*) n FROM orders WHERE status = 'paid'"),
    newMessages: n('SELECT COUNT(*) n FROM messages WHERE handled = 0'),
  });
});

// ---- members ----
const USER_COLS = `u.id, u.member_no AS memberNo, u.name, u.email, u.role, u.status, u.created_at AS createdAt,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orderCount`;

function userFilter(req) {
  const where = [];
  const args = [];
  const q = str(req.query.q, 80);
  if (q) {
    where.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR u.member_no LIKE ? ESCAPE '\\')");
    args.push(like(q), like(q), like(q));
  }
  if (['active', 'suspended'].includes(req.query.status)) { where.push('u.status = ?'); args.push(req.query.status); }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

r.get('/users', requirePerm('users:read'), (req, res) => {
  const { sql, args } = userFilter(req);
  const { page, limit, offset } = paging(req);
  const total = db.prepare(`SELECT COUNT(*) n FROM users u ${sql}`).get(...args).n;
  const users = db.prepare(`SELECT ${USER_COLS} FROM users u ${sql} ORDER BY u.id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
  res.json({ users, total, page, pageSize: limit });
});

r.get('/users.csv', requirePerm('users:export'), (req, res) => {
  const { sql, args } = userFilter(req);
  const rows = db.prepare(`SELECT u.member_no, u.name, u.email, u.role, u.status, u.created_at FROM users u ${sql} ORDER BY u.id`).all(...args);
  // Prefix risky leading characters so spreadsheets don't execute cell contents.
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = ['member_no,name,email,role,status,joined', ...rows.map((x) => [x.member_no, x.name, x.email, x.role, x.status, x.created_at].map(cell).join(','))].join('\r\n');
  audit(req.user.id, 'users.export', null, { count: rows.length });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
  res.send(`\uFEFF${csv}`);
});

r.get('/users/:id', requirePerm('users:read'), (req, res) => {
  const user = db.prepare(`SELECT ${USER_COLS} FROM users u WHERE u.id = ?`).get(req.params.id);
  if (!user) return bad(res, 'not_found', 404);
  const orders = db.prepare('SELECT id, product_slug AS slug, options, total, status, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY id DESC').all(user.id)
    .map((o) => ({ ...o, options: jsonOr(o.options, []) }));
  res.json({ user, orders });
});

r.patch('/users/:id', requirePerm('users:write'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return bad(res, 'not_found', 404);
  const name = str(req.body.name, 80) || target.name;
  const email = str(req.body.email, 120).toLowerCase() || target.email;
  if (!EMAIL_RE.test(email)) return bad(res, 'email_invalid');
  if (db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').get(email, target.id)) return bad(res, 'email_taken', 409);
  let status = target.status;
  if (req.body.status !== undefined && req.body.status !== target.status) {
    if (!['active', 'suspended'].includes(req.body.status)) return bad(res, 'invalid_status');
    if (target.id === req.user.id) return bad(res, 'cannot_self', 403);
    if (target.role !== 'member') return bad(res, 'protected_account', 403);
    status = req.body.status;
  }
  db.prepare('UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?').run(name, email, status, target.id);
  audit(req.user.id, 'user.update', target.member_no, { before: { name: target.name, email: target.email, status: target.status }, after: { name, email, status } });
  res.json({ user: db.prepare(`SELECT ${USER_COLS} FROM users u WHERE u.id = ?`).get(target.id) });
});

r.post('/users/:id/reset-password', requirePerm('users:write'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return bad(res, 'not_found', 404);
  if (target.role !== 'member' && target.id !== req.user.id) return bad(res, 'protected_account', 403);
  const temp = randomBytes(9).toString('base64url');
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(hashPassword(temp), target.id);
  audit(req.user.id, 'user.reset_password', target.member_no);
  res.json({ temporaryPassword: temp });
});

r.delete('/users/:id', requirePerm('users:delete'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return bad(res, 'not_found', 404);
  if (target.id === req.user.id) return bad(res, 'cannot_self', 403);
  if (target.role !== 'member') return bad(res, 'protected_account', 403);
  if (db.prepare('SELECT 1 FROM orders WHERE user_id = ?').get(target.id)) return bad(res, 'has_orders', 409);
  db.prepare('UPDATE messages SET user_id = NULL WHERE user_id = ?').run(target.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  audit(req.user.id, 'user.delete', target.member_no, { name: target.name, email: target.email });
  res.json({ ok: true });
});

// ---- orders ----
const ORDER_STATUS = ['awaiting_payment', 'paid', 'cancelled'];
const ORDER_SELECT = `o.id, o.product_slug AS slug, o.options, o.total, o.status, o.created_at AS createdAt, o.paid_at AS paidAt,
  u.id AS userId, u.member_no AS memberNo, u.name AS memberName, u.email AS memberEmail`;
const shapeOrder = (o) => ({ ...o, options: jsonOr(o.options, []) });

r.get('/orders', requirePerm('orders:read'), (req, res) => {
  const where = [];
  const args = [];
  if (ORDER_STATUS.includes(req.query.status)) { where.push('o.status = ?'); args.push(req.query.status); }
  const q = str(req.query.q, 80);
  if (q) {
    where.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR u.member_no LIKE ? ESCAPE '\\' OR CAST(o.id AS TEXT) = ?)");
    args.push(like(q), like(q), like(q), q.replace(/^#/, ''));
  }
  const sql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { page, limit, offset } = paging(req);
  const total = db.prepare(`SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id ${sql}`).get(...args).n;
  const orders = db.prepare(`SELECT ${ORDER_SELECT} FROM orders o JOIN users u ON u.id = o.user_id ${sql} ORDER BY o.id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset).map(shapeOrder);
  res.json({ orders, total, page, pageSize: limit });
});

r.patch('/orders/:id', requirePerm('orders:write'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return bad(res, 'not_found', 404);
  const status = req.body.status;
  if (!ORDER_STATUS.includes(status)) return bad(res, 'invalid_status');
  db.prepare("UPDATE orders SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?").run(status, status, order.id);
  audit(req.user.id, 'order.status', `#${order.id}`, { from: order.status, to: status });
  res.json({ order: shapeOrder(db.prepare(`SELECT ${ORDER_SELECT} FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`).get(order.id)) });
});

// ---- contact messages ----
r.get('/messages', requirePerm('messages:read'), (req, res) => {
  const where = [];
  const args = [];
  if (req.query.status === 'new') where.push('m.handled = 0');
  if (req.query.status === 'handled') where.push('m.handled = 1');
  const sql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { page, limit, offset } = paging(req);
  const total = db.prepare(`SELECT COUNT(*) n FROM messages m ${sql}`).get(...args).n;
  const messages = db.prepare(`SELECT m.id, m.name, m.email, m.body, m.handled, m.created_at AS createdAt, u.member_no AS memberNo
    FROM messages m LEFT JOIN users u ON u.id = m.user_id ${sql} ORDER BY m.id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset)
    .map((m) => ({ ...m, handled: !!m.handled }));
  res.json({ messages, total, page, pageSize: limit });
});

r.patch('/messages/:id', requirePerm('messages:write'), (req, res) => {
  const m = db.prepare('SELECT id FROM messages WHERE id = ?').get(req.params.id);
  if (!m) return bad(res, 'not_found', 404);
  db.prepare('UPDATE messages SET handled = ? WHERE id = ?').run(req.body.handled ? 1 : 0, m.id);
  audit(req.user.id, 'message.handled', `#${m.id}`, { handled: !!req.body.handled });
  res.json({ ok: true });
});

export default r;
