import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE || resolve(here, '../data/winningea.db');
mkdirSync(dirname(file), { recursive: true });

export const db = new DatabaseSync(file);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_slug TEXT NOT NULL,
    options TEXT NOT NULL DEFAULT '[]',
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'awaiting_payment',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---- lightweight migrations for databases created by earlier versions ----
const hasCol = (t, c) => db.prepare(`PRAGMA table_info(${t})`).all().some((x) => x.name === c);
const addCol = (t, c, def) => { if (!hasCol(t, c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`); };
addCol('users', 'role', "TEXT NOT NULL DEFAULT 'member'");
addCol('users', 'status', "TEXT NOT NULL DEFAULT 'active'");
addCol('users', 'legacy_login', 'TEXT');
addCol('users', 'username', 'TEXT');
addCol('users', 'token_version', 'INTEGER NOT NULL DEFAULT 0');
addCol('users', 'family_name', 'TEXT');
addCol('users', 'given_name', 'TEXT');
addCol('users', 'family_kana', 'TEXT');
addCol('users', 'given_kana', 'TEXT');
addCol('users', 'birth_year', 'INTEGER');
addCol('users', 'birth_month', 'INTEGER');
addCol('users', 'birth_day', 'INTEGER');
addCol('users', 'gender', 'TEXT');
addCol('users', 'postal_code', 'TEXT');
addCol('users', 'prefecture', 'TEXT');
addCol('users', 'city', 'TEXT');
addCol('users', 'address_line', 'TEXT');
addCol('users', 'building', 'TEXT');
addCol('users', 'phone', 'TEXT');
addCol('users', 'occupation', 'TEXT');
addCol('users', 'income', 'TEXT');
addCol('users', 'investment_purpose', 'TEXT');
addCol('users', 'fx_experience', 'TEXT');
addCol('users', 'terms_agreed_at', 'TEXT');
addCol('users', 'reset_token_hash', 'TEXT');
addCol('users', 'reset_expires_at', 'TEXT');
addCol('orders', 'paid_at', 'TEXT');
addCol('messages', 'handled', 'INTEGER NOT NULL DEFAULT 0');
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_users_legacy ON users(legacy_login);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE) WHERE username IS NOT NULL;
`);
