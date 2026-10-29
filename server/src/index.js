import dotenv from 'dotenv';
// Keep local Winning EA settings isolated from a PORT inherited from another app.
// Production Plesk does not upload server/.env, so its managed PORT remains authoritative there.
dotenv.config({ override: true });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { PRODUCTS, OPTIONS, findProduct } from './products.js';
import { JWT_SECRET, EMAIL_RE, USERNAME_RE, bad, str, sign, publicUser, auth } from './shared.js';
import { hashPassword, verifyPassword } from './password.js';
import adminRouter from './admin.js';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const clientOrigin = process.env.CLIENT_ORIGIN || (isProd ? false : 'http://localhost:5173');
const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '';

async function verifyRecaptcha(token, remoteIp) {
  if (!recaptchaSecret) return !isProd;
  if (typeof token !== 'string' || !token) return false;
  try {
    const body = new URLSearchParams({ secret: recaptchaSecret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body });
    const result = await response.json();
    return result.success === true;
  } catch { return false; }
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '400kb' }));

const limiter = (max) => rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false });

function newMemberNo() {
  for (;;) {
    const n = String(randomInt(1000000, 9999999));
    if (!db.prepare('SELECT 1 FROM users WHERE member_no = ?').get(n)) return n;
  }
}

// ---------- auth ----------
app.post('/api/auth/register', limiter(20), async (req, res) => {
  if (!await verifyRecaptcha(req.body.recaptchaToken, req.ip)) return bad(res, recaptchaSecret ? 'recaptcha_required' : 'recaptcha_unavailable', 400);
  const name = str(req.body.name, 80);
  const username = str(req.body.username, 32).toLowerCase();
  const email = str(req.body.email, 120).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name) return bad(res, 'name_required');
  if (!USERNAME_RE.test(username)) return bad(res, 'username_invalid');
  if (!EMAIL_RE.test(email)) return bad(res, 'email_invalid');
  if (password.length < 8 || password.length > 100) return bad(res, 'password_short');
  if (req.body.agree !== true) return bad(res, 'terms_required');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return bad(res, 'email_taken', 409);
  if (db.prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE OR legacy_login = ? COLLATE NOCASE').get(username, username)) return bad(res, 'username_taken', 409);
  const info = db
    .prepare('INSERT INTO users (member_no, username, name, email, password_hash) VALUES (?,?,?,?,?)')
    .run(newMemberNo(), username, name, email, hashPassword(password));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', limiter(30), async (req, res) => {
  if (!await verifyRecaptcha(req.body.recaptchaToken, req.ip)) return bad(res, recaptchaSecret ? 'recaptcha_required' : 'recaptcha_unavailable', 400);
  // `email` may also be the member's old WordPress username (imported accounts).
  const ident = str(req.body.email, 120);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ? COLLATE NOCASE OR legacy_login = ? COLLATE NOCASE').get(ident, ident, ident);
  const check = user ? verifyPassword(password, user.password_hash) : { ok: false };
  if (!user || !check.ok) return bad(res, 'invalid_credentials', 401);
  if (user.status !== 'active') return bad(res, 'account_suspended', 403);
  if (check.legacy) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id); // upgrade WordPress hash
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.put('/api/me', auth, (req, res) => {
  const profileForm = req.body.profileForm === true;
  const familyName = str(req.body.familyName, 40);
  const givenName = str(req.body.givenName, 40);
  const familyKana = str(req.body.familyKana, 80);
  const givenKana = str(req.body.givenKana, 80);
  const birthYear = Number(req.body.birthYear) || null;
  const birthMonth = Number(req.body.birthMonth) || null;
  const birthDay = Number(req.body.birthDay) || null;
  const gender = str(req.body.gender, 20);
  const postalCode = str(req.body.postalCode, 20);
  const prefecture = str(req.body.prefecture, 40);
  const city = str(req.body.city, 80);
  const addressLine = str(req.body.addressLine, 120);
  const building = str(req.body.building, 120);
  const phone = str(req.body.phone, 30);
  const occupation = str(req.body.occupation, 40);
  const income = str(req.body.income, 40);
  const investmentPurpose = str(req.body.investmentPurpose, 40);
  const fxExperience = str(req.body.fxExperience, 40);
  const name = (familyName || givenName) ? `${familyName} ${givenName}`.trim() : (str(req.body.name, 80) || req.user.name);
  const email = str(req.body.email, 120).toLowerCase() || req.user.email;
  if (!EMAIL_RE.test(email)) return bad(res, 'email_invalid');
  if (profileForm) {
    if (!familyName || !givenName || !familyKana || !givenKana || !gender || !postalCode || !prefecture || !city || !addressLine || !phone) return bad(res, 'profile_required');
    if (!/^[0-9]{4}$/.test(String(birthYear)) || birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) return bad(res, 'profile_invalid');
    if (req.body.emailConfirm !== email) return bad(res, 'email_mismatch');
    if (req.body.termsAccepted !== true) return bad(res, 'terms_required');
  }
  const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
  if (clash) return bad(res, 'email_taken', 409);
  let avatar = req.user.avatar;
  if (req.body.avatar === null) avatar = null;
  else if (typeof req.body.avatar === 'string') {
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(req.body.avatar) || req.body.avatar.length > 300000) return bad(res, 'avatar_invalid');
    avatar = req.body.avatar;
  }
  db.prepare(`UPDATE users SET name = ?, email = ?, avatar = ?, family_name = ?, given_name = ?, family_kana = ?, given_kana = ?,
    birth_year = ?, birth_month = ?, birth_day = ?, gender = ?, postal_code = ?, prefecture = ?, city = ?, address_line = ?,
    building = ?, phone = ?, occupation = ?, income = ?, investment_purpose = ?, fx_experience = ?,
    terms_agreed_at = CASE WHEN ? THEN COALESCE(terms_agreed_at, CURRENT_TIMESTAMP) ELSE terms_agreed_at END WHERE id = ?`)
    .run(name, email, avatar, familyName || req.user.family_name, givenName || req.user.given_name, familyKana || req.user.family_kana, givenKana || req.user.given_kana,
      birthYear || req.user.birth_year, birthMonth || req.user.birth_month, birthDay || req.user.birth_day, gender || req.user.gender, postalCode || req.user.postal_code,
      prefecture || req.user.prefecture, city || req.user.city, addressLine || req.user.address_line, building || req.user.building, phone || req.user.phone,
      occupation || req.user.occupation, income || req.user.income, investmentPurpose || req.user.investment_purpose, fxExperience || req.user.fx_experience,
      req.body.termsAccepted === true ? 1 : 0, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.put('/api/me/password', auth, limiter(20), async (req, res) => {
  if (!await verifyRecaptcha(req.body.recaptchaToken, req.ip)) return bad(res, recaptchaSecret ? 'recaptcha_required' : 'recaptcha_unavailable', 400);
  const { currentPassword, newPassword } = req.body;
  if (!verifyPassword(currentPassword, req.user.password_hash).ok) return bad(res, 'invalid_credentials', 401);
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 100) return bad(res, 'password_short');
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(hashPassword(newPassword), req.user.id);
  res.json({ ok: true });
});

// ---------- catalogue ----------
app.get('/api/products', (_req, res) => res.json({ products: PRODUCTS, options: OPTIONS }));
app.get('/api/products/:slug', (req, res) => {
  const product = findProduct(req.params.slug);
  if (!product) return bad(res, 'not_found', 404);
  res.json({ product, options: OPTIONS });
});

// ---------- orders (bank transfer) ----------
app.post('/api/orders', auth, limiter(60), (req, res) => {
  const product = findProduct(req.body.slug);
  if (!product) return bad(res, 'not_found', 404);
  const ids = Array.isArray(req.body.options) ? [...new Set(req.body.options)] : [];
  const chosen = ids.map((id) => OPTIONS.find((o) => o.id === id));
  if (chosen.some((o) => !o)) return bad(res, 'invalid_option');
  const total = product.price + chosen.reduce((s, o) => s + o.price, 0);
  const info = db
    .prepare('INSERT INTO orders (user_id, product_slug, options, total) VALUES (?,?,?,?)')
    .run(req.user.id, product.slug, JSON.stringify(ids), total);
  res.status(201).json({
    order: { id: Number(info.lastInsertRowid), slug: product.slug, options: ids, total },
    bank: {
      name: process.env.BANK_NAME || 'みずほ銀行',
      branch: process.env.BANK_BRANCH || '神戸支店',
      type: process.env.BANK_TYPE || '普通',
      number: process.env.BANK_NUMBER || '1863526',
      holder: process.env.BANK_HOLDER || 'コラボックス（ド',
    },
    memberNo: req.user.member_no,
  });
});

// ---------- contact ----------
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

app.post('/api/auth/forgot-password', limiter(10), async (req, res) => {
  if (!await verifyRecaptcha(req.body.recaptchaToken, req.ip)) return bad(res, recaptchaSecret ? 'recaptcha_required' : 'recaptcha_unavailable', 400);
  const email = str(req.body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return bad(res, 'email_invalid');
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (user) {
    const raw = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET reset_token_hash = ?, reset_expires_at = ? WHERE id = ?').run(hash, expires, user.id);
    const link = `${clientOrigin || 'http://localhost:5173'}/reset-password?token=${raw}`;
    if (transporter) await transporter.sendMail({ from: process.env.SMTP_FROM, to: user.email, subject: '[Winning EA] Reset your password', text: `Use this link to reset your password (valid for 1 hour):\n\n${link}` }).catch((e) => console.error('reset mail failed:', e.message));
  }
  res.json({ ok: true });
});

app.post('/api/auth/reset-password', limiter(10), (req, res) => {
  const token = str(req.body.token, 128);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (password.length < 8 || password.length > 100) return bad(res, 'password_short');
  const hash = createHash('sha256').update(token).digest('hex');
  const user = db.prepare('SELECT id FROM users WHERE reset_token_hash = ? AND reset_expires_at > ?').get(hash, new Date().toISOString());
  if (!user) return bad(res, 'reset_invalid', 400);
  db.prepare('UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_expires_at = NULL, token_version = token_version + 1 WHERE id = ?').run(hashPassword(password), user.id);
  res.json({ ok: true });
});

app.post('/api/contact', limiter(10), async (req, res) => {
  if (!await verifyRecaptcha(req.body.recaptchaToken, req.ip)) return bad(res, recaptchaSecret ? 'recaptcha_required' : 'recaptcha_unavailable', 400);
  const name = str(req.body.name, 80);
  const email = str(req.body.email, 120);
  const body = str(req.body.message, 4000);
  if (!name) return bad(res, 'name_required');
  if (!EMAIL_RE.test(email)) return bad(res, 'email_invalid');
  if (!body) return bad(res, 'message_required');
  let userId = null;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    try { userId = jwt.verify(h.slice(7), JWT_SECRET).sub; } catch { /* anonymous */ }
  }
  db.prepare('INSERT INTO messages (user_id, name, email, body) VALUES (?,?,?,?)').run(userId, name, email, body);
  if (transporter && process.env.CONTACT_TO) {
    transporter
      .sendMail({ from: process.env.SMTP_FROM, to: process.env.CONTACT_TO, replyTo: email, subject: `[Winning EA] Contact from ${name}`, text: `${name} <${email}>\n\n${body}` })
      .catch((e) => console.error('mail failed:', e.message));
  }
  res.status(201).json({ ok: true });
});

app.use('/api/admin', adminRouter);
app.use('/api', (_req, res) => bad(res, 'not_found', 404));

// ---------- serve the built React app (production) ----------
const dist = resolve(here, '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Winning EA API on http://localhost:${PORT}`));
