# Winning EA – React rebuild

React + Vite + Tailwind front end (JA/EN) with a small Express + SQLite API.

## Run it
```bash
npm run install:all
cp server/.env.example server/.env     # set JWT_SECRET, SMTP, bank details
npm run dev                            # web http://localhost:5173  api http://localhost:4000
```
Production: `npm run build && NODE_ENV=production npm start` (the server serves `client/dist` and the API on one port). Needs Node 22.5+ (uses the built-in `node:sqlite`).

## Pages
`/` home · `/products/:slug` detail + price calculator + backtest · `/products/:slug/buy` bank-transfer instructions
`/custom-tool` · `/contact` · `/terms` · `/login` · `/register` · `/profile` (+ `/edit`, `/password`)

## API (server/src/index.js)
`POST /api/auth/register|login` · `GET|PUT /api/me` · `PUT /api/me/password` · `GET /api/products[/:slug]`
`POST /api/orders` (price computed server-side) · `POST /api/contact` (stored in DB, emailed if SMTP is set)

## Assets to drop in `client/public/images/` (all optional; gradients/icons show until supplied)
`hero.jpg` (home hero, man + tablet) · `about.jpg` (laptop, left of "Winning EAとは") · `what.jpg` (right of "システムトレードソフトとは")
`mt4.png` · `page-hero.jpg` (blue banner on inner pages) · `products/<slug>.png` for each product icon
Slugs: ultimate-trader, fx-sniper, silver-fox, infinity-z, scalping-master, gold-rush-system
Backtest reports: put the real MT4 HTML reports in `client/public/backtests/<slug>.html` (placeholders are there now).

## Content you should review
- Product data/prices: `server/src/products.js`. Bank details: `server/.env`.
- English copy and the English Terms of Use were translated by Claude; have a native speaker / legal reviewer check the Terms.
- Brand name is "Winning EA" throughout the application.

## Admin area (`/admin`)
Roles are set only from the command line (never from the website):
```bash
npm run set-role --prefix server -- you@example.com admin
npm run set-role --prefix server -- colleague@example.com staff
```
Only one admin and one staff are allowed unless you pass `--force`.

| | admin | staff |
|---|---|---|
| View members, orders, messages | yes | yes |
| Mark orders paid / cancelled, mark messages handled | yes | yes |
| Edit / suspend / delete members, issue temporary passwords, export CSV | yes | no |

Permissions live in `server/src/permissions.js`. Every admin action is written to the `audit_log` table. Suspending a member blocks their existing login immediately. Members who have orders cannot be deleted (suspend them instead). Admin/staff accounts cannot be suspended or deleted from the UI.

## Migrating WordPress members
1. On the WordPress server: `wp user list --fields=ID,user_login,user_email,user_pass,display_name,user_registered --format=csv > users.csv`
   (or export the `wp_users` table from phpMyAdmin as CSV). **This file contains password hashes: keep it private and delete it afterwards.**
2. Preview: `npm run import-wp --prefix server -- users.csv --dry-run`
3. Import: `npm run import-wp --prefix server -- users.csv`
Passwords are not reset: WordPress hashes (phpass, WordPress 6.8+ bcrypt, old MD5) are verified at login and upgraded to bcrypt on the member's first login. Members can log in with their email **or** their old WordPress username. The WordPress user ID is kept as the 会員NO. The import can be re-run safely (existing emails are skipped).
