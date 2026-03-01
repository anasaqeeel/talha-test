# Crypto Sentry – Progress Report (80% Complete)

**Project:** Bitbash Crypto Sentry – Real-Time Market Surveillance Terminal  
**Reference:** Bitbash Crypto Sentry – Comprehensive Intern Development Guide (full document)  
**Date:** [Add date when you share]  
**Status:** Approximately **80%** of scope completed (understanding + development), aligned with doc

---

## Executive Summary

This report documents progress on the Crypto Sentry project against the client’s development guide. The majority of the doc has been implemented: two-server architecture (§4, §7), full setup and environment (§6), database with code-first migrations (§13), Express surveillance engine with 30s polling and 2% flash-crash detection with idempotency (§11, §15), NextAuth with Credentials and optional Google (§14), all API endpoints from the doc (§9), and the full Next.js terminal UI including dashboard with real-time polling and status badges (§12), watchlist (§16), alerts with filter (§12.1), market page with search (§12.1), and operator onboarding with spotlight guide (§17). Data flows (§8), security (auth + authorization on watchlist), stale-data handling (§12.4), and dual data source (Express cache + DB fallback for alerts) are in place. Remaining ~20% is production hardening (§19): structured logging to a standard, extended stability run, rate limiting on auth endpoints, and deployment checklist.

---

## 1. Document Coverage – Section-by-Section

| Section | Title | Status | Notes |
|--------|--------|--------|--------|
| 1 | Project Overview | Done | Goals (real-time surveillance, 2% detection, watchlist, mission-control UI, onboarding) understood and implemented |
| 2 | What You'll Learn | Done | Two servers, polling, flash-crash logic, Prisma, NextAuth, Framer Motion patterns applied |
| 3 | Technical Foundation | Done | Stack: Next.js 14+, TypeScript, Tailwind, Framer Motion, Lucide; Express, Prisma, PostgreSQL, NextAuth; CoinGecko |
| 4 | Core Concepts | Done | Why two servers (§4.1), polling vs streaming (§4.2), flash-crash algorithm (§4.3), idempotency (§4.4), server vs client state (§4.5) |
| 5 | Architecture Overview | Done | Express + Next.js + PostgreSQL + CoinGecko; data flow from market to user screen |
| 6 | Setup & Environment | Done | Prerequisites, env vars (.env.local), DB setup (Prisma init, migrate), dev:all script |
| 7 | Runtime Components | Done | Express engine (server.js) and Next.js app; responsibilities and key functions |
| 8 | Data & State Flow | Done | Auth flow (§8.1), dashboard data flow (§8.2), watchlist flow (§8.3) implemented |
| 9 | Frontend ↔ Backend Communication Map | Done | All endpoints from doc: signup, signin, prices, watchlist GET/POST/DELETE, alerts with limit |
| 10 | Backend ↔ Market Data Flow | Done | CoinGecko URL and params; Express polling loop every 30s |
| 11 | Express Surveillance Engine (Deep Dive) | Done | §11.1 responsibilities; §11.2 polling 30s + retry/rate-limit; §11.3 detection + idempotency; §11.4 cache with status |
| 12 | Next.js Terminal (Deep Dive) | Done | §12.1 six responsibilities (auth, real-time UI, watchlist, alerts, market, onboarding); §12.3 API routes; §12.4 polling 5s, clearInterval, stale 60s, STABLE/alert badges |
| 13 | Database Schema & Prisma ORM | Done | Code-first; User, Watchlist, CryptoAlert; relations; migrations; singleton Prisma client |
| 14 | Authentication & Authorization | Done | NextAuth Credentials + Google; JWT; signup with bcrypt; session verification; auth on watchlist |
| 15 | Flash Crash Detection System | Done | Baseline comparison, 2% threshold, 60s cooldown, DB write, no duplicate alerts |
| 16 | Watchlist Management System | Done | Add/remove, persistence in DB, watchlist page, optimistic UI, DELETE by id (§9) |
| 17 | User Onboarding (Spotlight Guide) | Done | Spotlight overlay, steps (dashboard-stats, nav-alerts, watchlist, market, profile), localStorage completion |
| 18 | Development Phases (Week Plan) | Partially | Days 1–6 scope largely covered; Day 7 stability testing in remaining 20% |
| 19 | Production Requirements | Partial | Error handling and fallbacks in place; structured logging standard and 24hr run in remaining 20% |
| 20 | Success Guidelines | Partial | Technical and UX criteria met for core features; operational criteria (logging standard, deployment doc) in remaining 20% |

---

## 2. Completed Work – Detailed (with doc references)

### 2.1 Project setup and environment (§3, §6)

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React; Express 5; Prisma; PostgreSQL; NextAuth (Auth.js v5); CoinGecko API.
- **Env:** `.env.local` holds `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SURVEILLANCE_PORT`, `NEXT_PUBLIC_SURVEILLANCE_URL`; optional `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for Google login.
- **Scripts (package.json):** `dev` (Next.js), `dev:server` (Express), `dev:all` (concurrently both), `db:migrate`, `db:push`, `db:generate`, `db:studio`, `db:seed`.
- **Prisma and env:** `scripts/prisma-env.js` loads `.env.local` and runs Prisma CLI so all DB commands use the same env (no separate `.env` for migrations).

### 2.2 Database (§13)

- **Approach:** Code-first. Single source of truth: `prisma/schema.prisma`.
- **User:** `id` (cuid), `email` (unique), `name`, `password` (optional for Google-only users), `createdAt`, `updatedAt`; relations to Watchlist and CryptoAlert.
- **Watchlist:** `id`, `coinId`, `coinName`, `symbol`, `userId` (FK → User, onDelete Cascade), `createdAt`; `@@unique([userId, coinId])`.
- **CryptoAlert:** `id`, `coinId`, `coinName`, `symbol`, `dropPercent`, `priceBefore`, `priceAfter`, `triggeredAt`, `userId` (optional FK).
- **Migrations:** `npm run db:migrate` generates and applies SQL under `prisma/migrations/`. DB viewable via PgAdmin (database `crypto_sentry`, schema `public`, tables `User`, `Watchlist`, `CryptoAlert`) or `npm run db:studio`.
- **Seed:** `prisma/seed.ts` creates demo user `demo@cryptosentry.com` / `demo1234`; loads `.env.local` so Prisma has `DATABASE_URL`.
- **Client:** `src/lib/prisma.ts` exports a singleton PrismaClient to avoid connection pool exhaustion in Next.js (§13.6).

### 2.3 Express surveillance engine (§7, §10, §11)

- **File:** `server.js` (Node, runs on port 4000; env from `.env.local`).
- **Dependencies:** express, cors, axios, @prisma/client, dotenv.
- **CORS:** Allowed origins include localhost:3000, 3002, 3003 so Next.js can call the engine.
- **MemoryCache class (§11.4):** In-memory store for `prices` (per-coin latest price and metadata), `baselines` (for detection), and `alerts` (last 100). Methods: `updatePrice`, `getAll`, `getAlerts(limit)`, `addAlert`, `getActiveAlertCoinIds()` (coins in “alert” in last 60s for UI status).
- **FlashCrashDetector class (§11.3, §15):** Holds baseline per coin; on each run compares current price to baseline; if drop ≥ 2%, checks idempotency (Prisma: no CryptoAlert for same coin in last 60s), then `prisma.cryptoAlert.create(...)` and `cache.addAlert(...)`; baseline updated for next cycle. Prevents duplicate alerts within 60s (§15.2).
- **Coin list:** Array `COINS` in server.js (15 CoinGecko ids: bitcoin, ethereum, solana, etc.). Single batched request per cycle (§10.2).
- **fetchWithRetry (§11.2):** GET to CoinGecko with axios; on 429 or error, exponential backoff (1s, 2s, 4s) and retry up to 3 times.
- **fetchMarketData:** Builds CoinGecko URL with `ids=...&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`; calls `fetchWithRetry`; for each coin updates cache and runs detector; logs success/failure.
- **Polling:** `fetchMarketData()` on startup and `setInterval(fetchMarketData, 30000)` (§10.2).
- **Routes:**  
  - `GET /api/prices` – returns cache with each coin enriched with `status: 'stable' | 'alert'` (§11.4).  
  - `GET /api/alerts` – returns in-memory alerts; query `?limit=50` supported (§9).  
  - `GET /api/health` – status, coin count, timestamp, cache age.  
  - `GET /cache` – same as prices (doc §12.3 fallback).

### 2.4 Authentication and authorization (§14)

- **NextAuth config:** `src/auth.ts`. Providers: Credentials (email/password), Google (optional).
- **Credentials authorize (§14.4, §14.5):** Receives email and password; `prisma.user.findUnique` by email; if user has no password (Google-only), returns null; else `bcrypt.compare`; on success returns `{ id, email, name }`. Generic “invalid credentials” behaviour (§14.10).
- **Google:** On first sign-in, JWT callback upserts User by email (create with email + name, no password); `token.id` set to DB user id so watchlist and protected routes work.
- **Session:** JWT strategy (§14.2); no Session table; cookie-based.
- **Pages:** Custom sign-in page `/login` (§14.3).
- **Callbacks:** `jwt` – stores user id and handles Google upsert; `session` – exposes `session.user.id`.
- **Middleware:** `middleware.ts` uses auth config; protects routes under `(app)`; redirects unauthenticated users to `/login` (§14.6).
- **Signup:** `POST /api/signup` in `src/app/api/signup/route.ts` – validates name, email, password; checks email unique; `bcrypt.hash(password, 12)`; `prisma.user.create`; returns 201 or 409 (§14.4).

### 2.5 API routes – full list (§9, §12.3)

| Method | Path | Handler | Auth | Doc |
|--------|------|---------|------|-----|
| POST | /api/signup | signup/route.ts | No | §9 Create user |
| (NextAuth) | /api/auth/* | auth/[...nextauth]/route.ts | – | §9 Signin, session |
| GET | /api/prices | prices/route.ts | No | §9 Get current prices |
| GET | /api/alerts | alerts/route.ts | No | §9 Alerts, optional limit |
| GET | /api/watchlist | watchlist/route.ts | Yes | §9 Get user watchlist |
| POST | /api/watchlist | watchlist/route.ts | Yes | §9 Add to watchlist |
| DELETE | /api/watchlist?coinId= | watchlist/route.ts | Yes | Remove by coin |
| DELETE | /api/watchlist/[id] | watchlist/[id]/route.ts | Yes | §9 Remove by entry id |

- **prices/route.ts:** Fetches `NEXT_PUBLIC_SURVEILLANCE_URL/api/prices`; returns JSON; on failure returns 503.
- **alerts/route.ts:** Tries Express `/api/alerts`; on failure falls back to `prisma.cryptoAlert.findMany` (orderBy triggeredAt desc, take 50), maps to same response shape (§12.3 dual data source).
- **watchlist/route.ts:** GET – `auth()`, then `prisma.watchlist.findMany` where userId; POST – body coinId, coinName, symbol; create; 409 if duplicate. DELETE – query param coinId; deleteMany for user + coinId.
- **watchlist/[id]/route.ts:** DELETE – auth; find entry by id; verify userId matches session; delete (§14.7 authorization).

### 2.6 Data flows (§8)

- **Auth flow (§8.1):** Login form → NextAuth signIn → authorize → JWT in cookie → protected routes read session.
- **Dashboard data flow (§8.2):** Page load → client fetches `/api/prices` and `/api/watchlist`; then `setInterval(fetch, 5000)` for prices; cleanup `clearInterval` on unmount (§12.4 memory leak prevention). API route proxies to Express; response includes status per coin; UI shows STABLE/alert and stale warning if data &gt;60s.
- **Watchlist flow (§8.3):** Star click → POST /api/watchlist (or DELETE by id/coinId); server creates/deletes Watchlist row; client updates list; watchlist page shows only user’s starred coins (§16).

### 2.7 Next.js UI – pages and components (§12.1)

- **app/layout.tsx:** Root layout; SessionProvider; global styles.
- **app/page.tsx:** Home; redirect to `/dashboard` if session else `/login`.
- **app/login/page.tsx:** Email/password form (Credentials); “Sign in with Google” button (signIn("google", callbackUrl)); link to signup.
- **app/signup/page.tsx:** Name, email, password; POST /api/signup; redirect to login on success.
- **app/(app)/layout.tsx:** Server-side `auth()`; redirect to /login if no session; renders Sidebar + children.
- **app/(app)/dashboard/page.tsx:** Client component; id `dashboard-stats` for onboarding (§17). Fetches prices every 5s and watchlist; renders AnimatedPriceCard per coin; StaleDataBanner when offline or data &gt;60s (§12.4); OnboardingSpotlight; watchlist star calls POST/DELETE watchlist; uses watchlist entry id for DELETE when available.
- **app/(app)/watchlist/page.tsx:** GET /api/watchlist; list of starred coins; remove via DELETE /api/watchlist/[id].
- **app/(app)/alerts/page.tsx:** GET /api/alerts?limit=50; list of alerts; filter dropdown by asset (§12.1); copy “≥2% within 30s” per doc.
- **app/(app)/market/page.tsx:** GET /api/prices; table of all coins; search by name/symbol (§12.1).
- **Sidebar:** Nav items with ids (nav-dashboard, nav-market, nav-watchlist, nav-alerts); id `nav-profile` for sign-out; alert count badge; signOut to /login.
- **AnimatedPriceCard:** Receives coin + optional status; STABLE (green) / “Protocol violation” (red) badge per doc §12.4; border and glow by status; price; star for watchlist; flash on price tick.
- **StaleDataBanner:** Shows when lastUpdate &gt;60s or offline; message “Data is Xs old” or “Surveillance engine offline”; refresh button (§12.4).
- **OnboardingSpotlight (§17):** Steps: Welcome, dashboard-stats, nav-alerts, nav-watchlist, nav-market, nav-profile. Uses getBoundingClientRect and clip-path for spotlight; localStorage key so guide shows once; Skip and Next/Finish.

### 2.8 Security and validation (§12.3, §14)

- **Auth on watchlist:** All watchlist endpoints require session; DELETE [id] verifies entry belongs to session.user.id (§14.7).
- **Signup:** Email and password required; duplicate email returns 409; password hashed with bcrypt (rounds 12).
- **Credentials login:** No distinction between “user not found” and “wrong password”; user.password null check for Google-only accounts.

### 2.9 Doc alignment – success criteria (partial §20)

- **Technical:** Two servers; 2% detection with idempotency; alerts in DB; watchlist persisted; types via Prisma/TypeScript.
- **UX:** Dashboard &lt;5s refresh; STABLE/alert badges; stale warning; onboarding dismissible; watchlist add/remove.
- **Operational:** README and EVALUATION_GUIDE with setup and run instructions; remaining: structured logging standard (§19.2), 24hr stability run (§19.1), deployment checklist (§19.4).

---

## 3. Remaining Work (~20%)

- **§19.1** – Run Express for 24+ hours and confirm memory stable; document or add simple memory check.
- **§19.2** – Adopt a structured logging format (e.g. timestamp, level, component, context) across server and API routes.
- **§19.4** – Rate limiting on signin/signup (e.g. per-IP or per-email); deployment checklist (env, HTTPS, secrets).
- **§18 Day 7** – Formal stability and deployment prep step; troubleshooting section in README if needed.
- **Optional:** Server Component initial data load for dashboard (§12.2) for faster first paint.

---

## 4. How to run

```bash
# Database (once)
createdb crypto_sentry
# .env.local: DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL, etc.

npm run db:migrate    # create/update tables
npm run db:seed       # optional: demo@cryptosentry.com / demo1234

# Application
npm run dev:all       # Express on 4000, Next.js on 3000/3003
```

- **Surveillance engine:** http://localhost:4000 (health: /api/health).
- **App:** http://localhost:3003 (or port shown in terminal); set NEXTAUTH_URL to that port.
- **DB UI:** `npm run db:studio` or PgAdmin → database `crypto_sentry`.

---

## 5. Summary

- **Doc coverage:** Sections 1–17 implemented in line with the guide; §18–20 partially (stability and production in remaining 20%).
- **Deliverables:** Full two-server setup, code-first DB, auth (Credentials + Google), surveillance engine (30s poll, 2% detection, idempotency, DB alerts, cache with status), all doc APIs, full terminal UI (dashboard, watchlist, alerts, market, onboarding), data flows, and security checks. Remaining: structured logging, 24hr stability run, auth rate limiting, and deployment checklist.
