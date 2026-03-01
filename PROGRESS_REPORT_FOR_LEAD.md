# Crypto Sentry – Progress Report

**Project:** Bitbash Crypto Sentry (Real-Time Market Surveillance Terminal)  
**Reference:** Bitbash Crypto Sentry – Comprehensive Intern Development Guide  
**Date:** [Add date when you share]  
**Status:** In progress – approximately **30–40%** of scope completed (understanding + development)

---

## Executive Summary

This report summarizes progress on the Crypto Sentry project against the client’s development guide. So far, the foundation is in place: two-server architecture (Express surveillance engine + Next.js terminal), database (PostgreSQL + Prisma, code-first), authentication (email/password + optional Google), core API routes, and main UI (dashboard, watchlist, alerts, market). Flash-crash detection (2% threshold, 30s polling, 60s idempotency) is implemented and writing to the database. Remaining work includes deeper alignment with doc patterns (e.g. Server/Client components), stability/observability, and production readiness.

---

## 1. Doc Coverage – What I’ve Used So Far

| Doc section | Topic | My focus |
|-------------|--------|----------|
| 1–5 | Overview, goals, tech stack, architecture | Read and used for setup and structure |
| 6 | Setup & environment | Applied: env, scripts, two servers |
| 7 | Runtime components | Implemented: Express engine vs Next.js roles |
| 8 | Data & state flow | Applied: auth, dashboard, watchlist flows |
| 9 | API endpoints map | Implemented: signup, signin, prices, watchlist, alerts |
| 10 | Backend ↔ market data | Applied: CoinGecko integration, polling |
| 11 | Express engine (polling, detection, cache) | Implemented: 30s poll, 2% detection, idempotency, cache |
| 12 | Next.js terminal (API routes, real-time UI) | Implemented: API routes, 5s polling, status badges |
| 13 | Database & Prisma | Implemented: schema, migrations, code-first |
| 14 | Auth & authorization | Implemented: NextAuth Credentials, JWT, protected routes |
| 15–16 | Flash-crash logic, watchlist | Implemented: detection, DB alerts, watchlist CRUD |
| 17 | Onboarding (spotlight) | Implemented: basic spotlight guide |
| 18–20 | Week plan, production, success criteria | Partially read; planned for next phase |

---

## 2. Completed Work (with doc references)

### 2.1 Setup & environment (§6)

- Next.js 16 + TypeScript + Tailwind project.
- Separate Express server (surveillance engine).
- Environment: `.env.local` (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, etc.).
- Prisma CLI uses env via `scripts/prisma-env.js` for migrations.
- NPM scripts: `dev`, `dev:server`, `dev:all`, `db:migrate`, `db:seed`, `db:studio`.

### 2.2 Database (§13)

- **Approach:** Code-first. Schema in `prisma/schema.prisma`.
- **Tables:** User (id, email, name, password optional, timestamps), Watchlist (userId, coinId, coinName, symbol, unique per user+coin), CryptoAlert (coinId, coinName, symbol, dropPercent, priceBefore, priceAfter, triggeredAt).
- Migrations applied; DB viewable via PgAdmin or `npm run db:studio`.
- Seed script for demo user (email/password).

### 2.3 Express surveillance engine (§7, §11)

- **File:** `server.js` (runs on port 4000).
- **Polling:** CoinGecko API every **30 seconds** (§11.2); single request for all configured coins.
- **Flash-crash detection (§11.3, §15):** Baseline vs current price; alert when drop ≥ **2%**; **60-second idempotency** (no duplicate alert for same coin within 60s).
- **Memory cache (§11.4):** Latest prices and recent alerts in memory; each price has status `stable` or `alert`.
- **Endpoints:** `/api/prices`, `/api/alerts`, `/api/health`, `/cache`.
- **Persistence:** Alerts written to PostgreSQL (CryptoAlert table) via Prisma.
- **Resilience:** Retry and basic handling for CoinGecko rate limits/errors (§11.2).

### 2.4 Authentication (§14)

- **Signup:** `POST /api/signup` – validation, bcrypt hash, create User.
- **Login:** NextAuth Credentials provider – email/password validated against DB, JWT session.
- **Google OAuth:** Optional “Sign in with Google” (localhost); requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in env.
- **Protected routes:** Dashboard, Watchlist, Alerts, Market require session; otherwise redirect to `/login`.

### 2.5 API routes (§9, §12.3)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| /api/auth/* | (NextAuth) | Sign in, sign out, session | – |
| /api/signup | POST | Create user | No |
| /api/prices | GET | Proxy to Express; prices + status | No |
| /api/alerts | GET | Proxy to Express; fallback to DB | No |
| /api/watchlist | GET | List user’s watchlist | Yes |
| /api/watchlist | POST | Add coin to watchlist | Yes |
| /api/watchlist | DELETE | Remove by coinId | Yes |
| /api/watchlist/[id] | DELETE | Remove by entry id | Yes |

### 2.6 UI – Next.js terminal (§12)

- **Dashboard:** Live price cards, 5s polling, STABLE / Protocol violation badges, watchlist star, stale-data warning (>60s or engine offline).
- **Watchlist:** Page listing starred coins; remove from watchlist.
- **Alerts:** List of flash-crash events; filter by asset.
- **Market:** Table of all coins; search by name/symbol.
- **Navigation:** Sidebar (Dashboard, Market, Watchlist, Alerts, Sign out).
- **Onboarding (§17):** Spotlight-style guide (steps, dismissible, completion in localStorage).

### 2.7 Doc alignment checklist

- [x] Two servers (Express + Next.js) as per doc.
- [x] 30s engine polling, 5s UI polling.
- [x] 2% flash-crash threshold, 60s cooldown.
- [x] Alerts stored in DB; in-memory cache for prices.
- [x] Watchlist: add/remove, persisted, auth required.
- [x] Alerts API: proxy to engine + DB fallback when engine down.

---

## 3. Remaining Work (planned)

- **§12.2** – More deliberate use of Server vs Client components (e.g. initial data in Server Components).
- **§18** – Align remaining tasks with the week plan and success criteria.
- **§19** – Stability and observability: structured logging, error-handling standards, long-run checks.
- **Production** – Rate limiting on auth, security checklist, deployment and env documentation.

---

## 4. How to run

```bash
# 1. Create DB (once)
createdb crypto_sentry

# 2. Env in .env.local (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, etc.)

# 3. Migrations
npm run db:migrate

# 4. Optional: seed demo user
npm run db:seed

# 5. Run app (Express + Next.js)
npm run dev:all
```

- **Express:** http://localhost:4000  
- **Next.js:** http://localhost:3000 or 3003 (see terminal)  
- **Demo login (if seeded):** demo@cryptosentry.com / demo1234  

---

## 5. Summary

- **Understanding:** Doc sections 1–17 used for design and implementation; 18–20 partially covered and planned.
- **Development:** ~30–40% – working two-server setup, DB, auth, surveillance engine with detection and DB alerts, core APIs, and main UI with polling and basic UX.
- **Next:** Deeper component strategy, stability/observability, and production readiness; will share updates as I progress.
