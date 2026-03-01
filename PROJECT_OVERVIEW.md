# Crypto Sentry – Project overview

Quick reference for **login**, **database**, and **tech stack** (frontend + backend).

---

## Login (email & password)

- **There are no built-in users.** You either **sign up** or use the **seeded test user** (after running the seed).

### Option 1: Sign up

1. Open **http://localhost:3000** (or 3003 if that’s what Next.js chose).
2. Go to **Sign up** (or `/signup`).
3. Enter **name**, **email**, **password** → Create account.
4. You’re redirected to **Login** → use that **email** and **password** to sign in.

### Option 2: Seeded test user (after running seed)

After you run the database seed once (see **Database** below), you can log in with:

| Field     | Value                    |
|----------|---------------------------|
| **Email**    | `demo@cryptosentry.com`   |
| **Password** | `demo1234`                |

---

## Database

- **Engine:** **PostgreSQL**
- **Connection:** From `.env.local`:
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_sentry?schema=public"`
- So: **host** `localhost`, **port** `5432`, **user** `postgres`, **password** `postgres`, **database** `crypto_sentry`.

**ORM:** **Prisma**  
- Schema: `prisma/schema.prisma`  
- Models: **User**, **Watchlist**, **CryptoAlert**.

**Useful commands (from project root):**

```bash
# Create DB and run migrations (creates tables)
npm run db:migrate

# Or only push schema (no migration history)
npm run db:push

# Seed a test user (demo@cryptosentry.com / demo1234)
npm run db:seed

# Open Prisma Studio (DB GUI)
npm run db:studio
```

**Order:** Install deps → ensure PostgreSQL is running → `db:migrate` (or `db:push`) → optionally `db:seed` → then run the app.

---

## Tools & tech stack

### Frontend

| Layer        | Tech |
|-------------|------|
| Framework   | **Next.js 16** (App Router) |
| UI / styling| **React 19**, **Tailwind CSS 4** |
| Animations  | **Framer Motion** |
| Icons       | **Lucide React** |
| Auth (client)| **NextAuth.js v5** (Auth.js) – session, sign in/out |

- **Language:** TypeScript  
- **Port:** 3000 (or next free, e.g. 3003).

### Backend (two parts)

**1) Next.js API (same process as frontend)**  
- **Next.js API routes** under `src/app/api/`:
  - Auth: `api/auth/[...nextauth]`
  - Signup: `api/signup`
  - Proxies to surveillance server: `api/prices`, `api/alerts`
  - Watchlist: `api/watchlist` (uses DB + auth)
- **Auth:** NextAuth v5 with **Credentials** provider (email + password, checked against **User** in PostgreSQL via Prisma).
- **DB access:** **Prisma** → PostgreSQL.

**2) Surveillance server (separate Node process)**  
- **Runtime:** Node.js  
- **Server:** **Express 5**  
- **File:** `server.js` (root of project)  
- **Port:** 4000 (or `SURVEILLANCE_PORT` from env).  
- **Role:**
  - Fetches prices from **CoinGecko** (public API).
  - Keeps in-memory **cache** and **rolling baseline** (e.g. 5‑min).
  - **Flash-crash detection**: e.g. ≥2% drop vs baseline → adds to alerts.
  - Exposes:
    - `GET /api/prices` – current prices
    - `GET /api/alerts` – recent flash-crash alerts
    - `GET /api/health` – health check

**Other libs (backend / shared):**  
- **axios** – HTTP to CoinGecko  
- **cors** – allowed origins (e.g. localhost:3000, 3002)  
- **bcryptjs** – password hashing (signup + login)

### Database (again, for clarity)

- **PostgreSQL** (local: `localhost:5432`, DB name: `crypto_sentry`).
- **Prisma** for schema, migrations, and queries (User, Watchlist, CryptoAlert).

---

## Summary diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (localhost:3000)                                        │
│  Next.js app (React + Tailwind + Framer Motion + NextAuth)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js server (same process)                                   │
│  • App Router pages (dashboard, watchlist, alerts, market, login)  │
│  • API routes: /api/auth/*, /api/signup, /api/prices,            │
│    /api/alerts, /api/watchlist                                   │
│  • NextAuth (Credentials) + Prisma → PostgreSQL                  │
└───────┬─────────────────────────────────────────────┬───────────┘
        │                                             │
        │ fetch(SURVEILLANCE_URL/api/prices|alerts)    │ Prisma
        ▼                                             ▼
┌───────────────────────┐                   ┌─────────────────────┐
│  Surveillance server  │                   │  PostgreSQL          │
│  Express on :4000     │                   │  crypto_sentry       │
│  CoinGecko → cache    │                   │  User, Watchlist,    │
│  Flash-crash alerts   │                   │  CryptoAlert         │
└───────────────────────┘                   └─────────────────────┘
```

---

## Run everything

1. **Database:** PostgreSQL running, then:
   ```bash
   npm run db:migrate
   npm run db:seed   # optional: test user demo@cryptosentry.com / demo1234
   ```
2. **App (frontend + backend together):**
   ```bash
   npm run dev:all
   ```
   - Next.js: http://localhost:3000 (or 3003)  
   - Surveillance: http://localhost:4000  

Use **email + password** (signup or seeded user) to log in.
