# Winning EA deployment on Plesk Linux

## Recommended architecture

Run one Node.js application on the main domain:

- Your Winning EA domain serves the React application.
- Your Winning EA domain `/api/...` serves the Express API.
- Keep the frontend and API on the same origin.

## Build before upload

1. Create `client/.env` from `client/.env.example`.
2. Set `VITE_RECAPTCHA_SITE_KEY` in `client/.env`.
3. Run `npm run build` from the project root.
4. Upload the project files to the Plesk application root.

Do not upload `node_modules` or `server/.env`. Upload `server/data/winningea.db` so the imported Winning EA users are preserved. Never upload the original user/password export.

## Plesk Node.js settings

In Plesk, open Websites & Domains → your Winning EA domain → Node.js and set:

- Node.js version: `24.22.0`
- Application mode: `Production`
- Application root: the uploaded Winning EA project root
- Document root: `client/dist`
- Application startup file: `app.js`

Use Plesk's **NPM Install** control. The root `postinstall` script installs the client and server dependencies as well.

## Production environment variables

Add these through Plesk's custom environment variables section. Do not upload `server/.env`.

```env
NODE_ENV=production
CLIENT_ORIGIN=https://your-winning-ea-domain.example
JWT_SECRET=<unique random value, at least 32 characters>
RECAPTCHA_SECRET_KEY=<Google reCAPTCHA v2 secret key>
PORT=<leave managed by Plesk if Plesk supplies it>
```

Also add the bank, SMTP, and contact variables from `server/.env.example`.

## SQLite requirements

SQLite is acceptable for the initial single-instance deployment. Ensure `server/data` exists and is writable by the Node.js application, and configure Plesk backups for:

- `server/data/winningea.db`
- `server/data/winningea.db-wal`
- `server/data/winningea.db-shm`

Do not run multiple Node.js workers against this SQLite database. Migrate to MariaDB before scaling to multiple workers or if the site becomes business-critical.

## After upload

1. Run NPM Install in Plesk.
2. Confirm the Node.js startup file and production mode.
3. Enable/restart the application.
4. Confirm your Winning EA domain loads.
5. Test registration, email/username login, reCAPTCHA, contact submission, profile updates, password changes, and admin access.
6. Check Plesk logs if the application does not start.
