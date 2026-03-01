# Crypto Sentry – Complete Evaluation & Presentation Guide

Use this doc to present the project and answer questions. Everything is explained in simple terms.

---

## 1. What This App Does (30 seconds)

**Crypto Sentry** is a **real-time cryptocurrency surveillance terminal**. It:

- **Monitors** 15 coins (Bitcoin, Ethereum, etc.) every **30 seconds** via the CoinGecko API.
- **Detects flash crashes**: if any coin drops **≥2%** in 30 seconds, it creates an **alert** and saves it to the database.
- **Shows live prices** on a dashboard that refreshes every **5 seconds** (green = stable, red = alert).
- **Watchlist**: logged-in users can **star** coins and see only those on a dedicated page.
- **Alerts page**: list of all flash-crash events (filterable by coin).
- **Auth**: sign up / login with email + password (stored in DB, password hashed with bcrypt).

So: **two servers** (Express for surveillance + Next.js for the UI), **PostgreSQL** for users/watchlist/alerts, **NextAuth** for login.

---

## 2. Tech Stack (memorize this)

| Layer | What we use | Why |
|-------|-------------|-----|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion | Next.js = React framework with file-based routing; Tailwind = utility CSS; Framer Motion = animations. |
| **Backend (API)** | Next.js API Routes (inside the same Next.js app) | Handles signup, login proxy, watchlist, prices proxy, alerts. |
| **Backend (surveillance)** | Express.js (separate Node process) | Must run **all the time** to poll CoinGecko every 30s; Next.js API routes are short-lived, so we need a separate long-running server. |
| **Database** | PostgreSQL | Stores users, watchlists, alerts. |
| **ORM** | Prisma | Talks to PostgreSQL with TypeScript types; we define tables in `prisma/schema.prisma`. |
| **Auth** | NextAuth.js (Credentials provider) | Login/signup, JWT in cookies, session in the app. |
| **External API** | CoinGecko (free) | Live crypto prices. |

---

## 3. File & Folder Structure (every important bit)

```
crypto-sentry/
├── .env.local                 # Secrets: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, etc. (not in git)
├── package.json               # Dependencies + scripts (dev, dev:server, dev:all, db:migrate, db:seed)
├── server.js                  # ⭐ EXPRESS BACKEND – runs on port 4000, polls CoinGecko, detects crashes
├── next.config.ts             # Next.js config (minimal)
├── tsconfig.json              # TypeScript config
├── middleware.ts              # Next.js middleware – uses auth to protect /dashboard, /watchlist, etc.
│
├── prisma/
│   ├── schema.prisma          # ⭐ DB SCHEMA – defines User, Watchlist, CryptoAlert tables (code-first)
│   ├── seed.ts                # Seeds demo user (demo@cryptosentry.com / demo1234)
│   └── migrations/            # SQL migrations (created when you run db:migrate)
│
├── scripts/
│   └── prisma-env.js          # Loads .env.local then runs Prisma CLI (so migrate uses your DB URL)
│
└── src/
    ├── auth.ts                # ⭐ NextAuth config: Credentials provider, checks email/password with Prisma + bcrypt
    ├── auth.config.ts         # Auth middleware config (signIn page, who is allowed where)
    ├── lib/
    │   └── prisma.ts          # ⭐ Single Prisma client instance (singleton) so we don’t open too many DB connections
    │
    ├── app/                    # Next.js App Router (file = route)
    │   ├── layout.tsx          # Root layout (fonts, SessionProvider for auth)
    │   ├── page.tsx            # Home page (redirects to dashboard or login)
    │   ├── globals.css         # Global styles + Tailwind
    │   │
    │   ├── login/page.tsx      # Login form → calls NextAuth signIn
    │   ├── signup/page.tsx     # Signup form → POST /api/signup
    │   │
    │   ├── (app)/              # Route group: all pages here share layout with sidebar
    │   │   ├── layout.tsx      # Layout with Sidebar; checks auth, redirects to /login if not logged in
    │   │   ├── dashboard/page.tsx   # Main dashboard: price cards, 5s polling, watchlist star
    │   │   ├── watchlist/page.tsx   # List of starred coins; remove from watchlist
    │   │   ├── alerts/page.tsx     # List of flash-crash alerts; filter by asset
    │   │   └── market/page.tsx     # Table of all coins; search by name/symbol
    │   │
    │   └── api/                # API routes (backend endpoints)
    │       ├── auth/[...nextauth]/route.ts   # NextAuth catch-all (signin, signout, session)
    │       ├── signup/route.ts                # POST: create user, hash password, save to DB
    │       ├── prices/route.ts                # GET: proxy to Express (localhost:4000/api/prices)
    │       ├── alerts/route.ts                 # GET: proxy to Express, or fallback to DB if Express down
    │       ├── watchlist/route.ts              # GET (list), POST (add), DELETE (by ?coinId=)
    │       └── watchlist/[id]/route.ts        # DELETE by watchlist entry id (doc-compliant)
    │
    └── components/
        ├── Sidebar.tsx         # Left nav: Dashboard, Market, Watchlist, Alerts, Sign out
        ├── AnimatedPriceCard.tsx   # One price card: STABLE/alert badge, price, star for watchlist
        ├── StaleDataBanner.tsx     # Yellow/red banner when data is >60s old or engine offline
        ├── OnboardingSpotlight.tsx # First-time tutorial overlay (spotlight steps)
        └── PageTransition.tsx     # Optional page transition wrapper
```

**One-line summary:**  
- **server.js** = surveillance engine (Express).  
- **prisma/schema.prisma** = database tables.  
- **src/app/** = pages and API routes.  
- **src/auth.ts** = how login works.  
- **src/lib/prisma.ts** = how we talk to the DB from Next.js.

---

## 4. Database: Where Tables Are Defined & Code-First vs DB-First

### Where are tables defined?

**In one place:** `prisma/schema.prisma`.

That file defines three **models** (tables):

- **User** – id, email, name, password, createdAt, updatedAt.
- **Watchlist** – id, coinId, coinName, symbol, userId (FK to User), createdAt; unique on (userId, coinId).
- **CryptoAlert** – id, coinId, coinName, symbol, dropPercent, priceBefore, priceAfter, triggeredAt, userId (optional).

We **do not** write raw SQL to create tables. We run:

```bash
npm run db:migrate
```

Prisma then **generates SQL** from `schema.prisma` and applies it to PostgreSQL (creates/updates tables). The SQL is saved under `prisma/migrations/`.

### Code-first vs DB-first (for your lead)

- **Code-first (what we use):**  
  We write the schema in code (`schema.prisma`). We run `prisma migrate dev` and Prisma creates/updates the **real database** to match. The app is the source of truth; the DB follows the code.

- **DB-first:**  
  You create or change the database manually (SQL or a GUI like PgAdmin). Then you use a tool to generate types/schema from the DB. The database is the source of truth; the code follows the DB.

We use **code-first** so that:

- Tables and types stay in sync.
- Migrations are versioned in git.
- Everyone gets the same DB structure by running `npm run db:migrate`.

### How to view the complete DB

1. **PgAdmin (or any PostgreSQL client)**  
   - Connect to `localhost:5432`, database **crypto_sentry**, user **postgres**, password (e.g. **odoo15**).  
   - Go to: **Databases → crypto_sentry → Schemas → public → Tables.**  
   - You’ll see: **User**, **Watchlist**, **CryptoAlert** (names are case-sensitive, with quotes in SQL).

2. **Prisma Studio (built-in UI):**  
   ```bash
   npm run db:studio
   ```  
   Opens a browser UI to browse and edit the same tables.

3. **Raw SQL (e.g. in PgAdmin Query Tool):**  
   ```sql
   SELECT * FROM "User";
   SELECT * FROM "Watchlist";
   SELECT * FROM "CryptoAlert";
   ```

---

## 5. How to Set Up DB & Run the App (order of operations)

### Is it code-first or DB first?

**Code-first.** So the order is: **env → DB exists → run migrations (code creates tables) → optional seed → run app.**

### Step-by-step

1. **PostgreSQL** must be installed and running (e.g. port 5432).

2. **Create the database** (once):  
   ```bash
   sudo -u postgres createdb crypto_sentry
   ```  
   (Or in PgAdmin: create database `crypto_sentry`.)

3. **Configure env:**  
   In `.env.local` set at least:  
   - `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/crypto_sentry?schema=public"`  
   - `AUTH_SECRET` / `NEXTAUTH_SECRET`  
   - `NEXTAUTH_URL="http://localhost:3003"` (or whatever port Next.js uses).

4. **Create tables from schema (migrate):**  
   ```bash
   npm run db:migrate
   ```  
   When asked for a migration name, type e.g. `init`. This creates the **User**, **Watchlist**, **CryptoAlert** tables.

5. **Optional – seed demo user:**  
   ```bash
   npm run db:seed
   ```  
   Creates `demo@cryptosentry.com` / `demo1234`.

6. **Start the app:**  
   - **Backend (Express, port 4000):**  
     ```bash
     npm run dev:server
     ```  
   - **Frontend (Next.js, port 3000 or 3003):**  
     ```bash
     npm run dev
     ```  
   - **Or both in one terminal:**  
     ```bash
     npm run dev:all
     ```  
   Then open the URL Next.js prints (e.g. http://localhost:3003).

So: **DB first** only in the sense “create empty DB + env”; **then code first** (migrate creates tables from `schema.prisma`).

---

## 6. Backend (Express) – server.js in Detail

**What it is:** A separate Node process that runs all the time. It is **not** inside Next.js.

**What it does:**

1. **Loads env** from `.env.local` (dotenv).
2. **Creates Express app**, enables CORS (so Next.js on 3000/3003 can call it), uses JSON body parser.
3. **MemoryCache class:**  
   - Keeps in RAM: `prices` (latest price per coin), `baselines` (price used for crash detection), `alerts` (last 100 in-memory alerts).  
   - Methods: `updatePrice`, `getAll`, `getAlerts`, `addAlert`, `getActiveAlertCoinIds()` (coins in “alert” in last 60s for UI status).
4. **FlashCrashDetector class:**  
   - Every 30s we get new prices. For each coin we compare current price to **baseline**.  
   - If drop ≥ 2%: check **idempotency** (no alert for same coin in last 60s in DB), then `prisma.cryptoAlert.create(...)` and `cache.addAlert(...)`.  
   - Baseline updates over time (and 5‑minute refresh in cache).
5. **CoinGecko:**  
   - `fetchWithRetry()` – GET one URL for all 15 coins; on 429 or error, exponential backoff and retry.  
   - `fetchMarketData()` – calls that URL, updates cache, runs detector for each coin.
6. **Polling:**  
   - `fetchMarketData()` once at start, then `setInterval(fetchMarketData, 30000)`.
7. **Routes:**  
   - `GET /api/prices` – returns cache with each coin having `status: 'stable' | 'alert'`.  
   - `GET /api/alerts` – returns in-memory alerts (optional `?limit=`).  
   - `GET /api/health` – status, coin count, timestamp.  
   - `GET /cache` – same as prices (for doc compatibility).

**Why a separate server?** Next.js API routes are short-lived (serverless-style). They can’t hold a `setInterval` that runs forever. So we need a **long-running process** (Express) that keeps polling and keeping state in memory.

---

## 7. Frontend (Next.js) – Pages & Data Flow

- **app/page.tsx** – Home: if logged in, redirect to `/dashboard`; else redirect to `/login`.  
- **app/login/page.tsx** – Form (email, password). On submit: `signIn("credentials", { email, password, redirectTo: "/dashboard" })`.  
- **app/signup/page.tsx** – Form (name, email, password). On submit: `POST /api/signup`; on success, redirect to `/login`.  
- **app/(app)/layout.tsx** – Wraps dashboard/watchlist/alerts/market. Calls `auth()`; if no session, redirect to `/login`. Renders **Sidebar** + main content.  
- **app/(app)/dashboard/page.tsx** – Client component. Fetches `/api/prices` every 5s and `/api/watchlist`; renders **AnimatedPriceCard** for each coin; handles star/unstar (POST/DELETE watchlist). Shows **StaleDataBanner** if data is old or offline. Renders **OnboardingSpotlight**.  
- **app/(app)/watchlist/page.tsx** – GET `/api/watchlist`, list of starred coins; remove via `DELETE /api/watchlist/[id]`.  
- **app/(app)/alerts/page.tsx** – GET `/api/alerts?limit=50`, list of alerts; filter by asset (dropdown).  
- **app/(app)/market/page.tsx** – GET `/api/prices`, table of all coins; search by name/symbol.

Data flow in short: **Browser → Next.js API routes → Express (for prices/alerts) or Prisma (for watchlist, signup, auth).**

---

## 8. API Routes (Next.js) – What Each Does

| Method | Path | What it does | Auth? |
|--------|------|----------------|-------|
| (NextAuth) | `/api/auth/*` | Sign in, sign out, session | – |
| POST | `/api/signup` | Body: name, email, password. Hash password (bcrypt 12), create User in DB. Return 201 or 409 if email exists. | No |
| GET | `/api/prices` | Fetch `SURVEILLANCE_URL/api/prices` (Express). Return JSON; if Express down, 503. | No |
| GET | `/api/alerts` | Fetch Express `/api/alerts`; if fail, fallback: Prisma `cryptoAlert.findMany` last 50. | No |
| GET | `/api/watchlist` | `auth()`; then Prisma `watchlist.findMany` for `session.user.id`. | Yes |
| POST | `/api/watchlist` | Body: coinId, coinName, symbol. Auth; create Watchlist row. 409 if already exists. | Yes |
| DELETE | `/api/watchlist?coinId=` | Auth; delete watchlist row for user + coinId. | Yes |
| DELETE | `/api/watchlist/[id]` | Auth; find row by id, check userId; delete. | Yes |

So: **signup** and **prices/alerts** are public; **watchlist** is protected by session.

---

## 9. Auth (NextAuth) – How Login Works

- **Config in `src/auth.ts`:**  
  - **Credentials provider:** one strategy, “credentials”.  
  - **authorize:** receives email + password; loads user by email with Prisma; compares password with `bcrypt.compare`; if OK returns `{ id, email, name }`.  
  - **Session:** JWT strategy (no DB session table).  
  - **Pages:** signIn = `/login`.  
  - **Callbacks:** put `user.id` into JWT and then into `session.user.id`.

- **Middleware (`middleware.ts`):** Uses auth config; protects routes under (app); redirects unauthenticated users to `/login`.

- **Session in app:** `layout.tsx` wraps with `SessionProvider`. Pages use `useSession()` or server-side `auth()` to know who is logged in.

So: **Signup** writes hashed password to **User**; **login** is NextAuth Credentials + Prisma + bcrypt; **session** is JWT in a cookie.

---

## 10. Key Functions You Can Explain

- **server.js – `fetchMarketData()`:** Calls CoinGecko, updates MemoryCache, runs FlashCrashDetector for each coin; detector may create DB alert and in-memory alert.  
- **server.js – `FlashCrashDetector.analyze()`:** Compares current price to baseline; if drop ≥ 2%, checks 60s idempotency in DB, then creates CryptoAlert and adds to cache.  
- **auth.ts – `authorize()`:** Finds user by email, compares password with bcrypt, returns user object or null.  
- **api/signup/route.ts – POST:** Validates body, hashes password with bcrypt(12), creates User with Prisma, returns 201 or 409.  
- **lib/prisma.ts:** Exports a single PrismaClient instance (singleton) so we don’t open many DB connections (important for serverless-style routes).  
- **scripts/prisma-env.js:** Loads `.env.local` then runs the Prisma CLI (e.g. `migrate dev`) so Prisma sees `DATABASE_URL`.

---

## 11. Commands Cheat Sheet (for demo / questions)

| Task | Command |
|------|--------|
| Install deps | `npm install` |
| Create DB (once) | `sudo -u postgres createdb crypto_sentry` |
| Create tables from schema | `npm run db:migrate` (name e.g. `init`) |
| Seed demo user | `npm run db:seed` |
| Open DB GUI | `npm run db:studio` |
| Start Express only | `npm run dev:server` |
| Start Next.js only | `npm run dev` |
| Start both | `npm run dev:all` |

---

## 12. Quick Q&A for Your Lead

**Q: What’s the difference between the Express server and Next.js?**  
A: Express runs as a separate process and polls CoinGecko every 30s, keeps prices and baselines in memory, and writes alerts to the DB. Next.js serves the UI and API routes; those routes proxy to Express for prices/alerts and use Prisma for users and watchlist. We need two processes because Next.js API routes don’t stay running for continuous polling.

**Q: Where is the database schema?**  
A: In `prisma/schema.prisma`. We use a code-first approach: we change the schema and run `npm run db:migrate` to apply it to PostgreSQL.

**Q: How do you view the database?**  
A: With PgAdmin (connect to DB `crypto_sentry`) or with `npm run db:studio` (Prisma’s UI). Tables are User, Watchlist, CryptoAlert under schema `public`.

**Q: How does login work?**  
A: NextAuth with Credentials. User enters email/password; we look up the user in the DB and compare password with bcrypt. If it matches, NextAuth creates a JWT and sends it in a cookie. Protected routes check that session.

**Q: How do you start backend and frontend?**  
A: Backend: `npm run dev:server` (Express on 4000). Frontend: `npm run dev` (Next.js on 3000 or next free port). Or both: `npm run dev:all`.

**Q: Code-first or database-first?**  
A: Code-first. We define models in `prisma/schema.prisma` and run migrations to create/update the database. The code is the source of truth for the schema.

---

Use this guide to walk through the project and answer technical questions in your evaluation. Good luck.
