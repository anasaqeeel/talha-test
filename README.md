This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Create a `.env.local` in the project root with at least:

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/crypto_sentry?schema=public`)
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — for NextAuth (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_URL` — app URL (e.g. `http://localhost:3000`)
- Optional: `SURVEILLANCE_PORT=4000`, `NEXT_PUBLIC_SURVEILLANCE_URL=http://localhost:4000`

### 3. Database setup

**Prisma uses `.env.local`** for all DB commands (via `scripts/prisma-env.js`), so you don’t need a separate `.env` for `DATABASE_URL`.

1. **PostgreSQL** must be installed and running (e.g. on `localhost:5432`).
2. **Create the database** (if it doesn’t exist):
   ```bash
   createdb crypto_sentry
   ```
   Or in `psql`: `CREATE DATABASE crypto_sentry;`
3. **Run migrations** (creates tables):
   ```bash
   npm run db:migrate
   ```
   When prompted for a migration name, you can use `init` for the first one.
4. **Optional: seed a test user** (login: `demo@cryptosentry.com` / `demo1234`):
   ```bash
   npm run db:seed
   ```

### 4. Run the app

You need **both** the Next.js app and the surveillance backend.

**Option A – Two terminals**

- **Backend (surveillance engine, port 4000):**
  ```bash
  npm run dev:server
  ```

- **Frontend (Next.js, port 3000):**
  ```bash
  npm run dev
  ```

**Option B – One terminal (both together)**

```bash
npm run dev:all
```

Then open [http://localhost:3000](http://localhost:3000) (or the port Next.js prints, e.g. 3003). The surveillance engine writes flash-crash alerts to PostgreSQL and serves live prices; the Next.js app polls every 5s and shows a stale-data warning if the engine is offline.

### Troubleshooting: "Authentication failed" (P1000)

If `npm run db:migrate` fails with **"the provided database credentials for postgres are not valid"**:

1. **Check PostgreSQL is running**
   ```bash
   sudo systemctl status postgresql
   # or: pg_isready -h localhost -p 5432
   ```

2. **Test the credentials** (same user/password as in `DATABASE_URL`):
   ```bash
   psql -h localhost -U postgres -d postgres -c "SELECT 1"
   ```
   If it prompts for a password, use the one in your `.env.local` (e.g. `postgres`). If that fails, your Postgres user/password don’t match.

3. **Fix the password** (Linux, Postgres 14+):
   ```bash
   sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
   ```
   Then create the DB and retry:
   ```bash
   sudo -u postgres createdb crypto_sentry
   npm run db:migrate
   ```

4. **Or use your system PostgreSQL user** (if you log in with a different user):
   - In `.env.local`, set `DATABASE_URL` to use that user and its password, e.g.  
     `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/crypto_sentry?schema=public`
   - Create the database: `createdb crypto_sentry` (as that user), then run `npm run db:migrate`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
