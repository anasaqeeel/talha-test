// Express Surveillance Engine - Flash Crash Detector (per Bitbash spec)
require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.SURVEILLANCE_PORT || 4000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:3003"] }));
app.use(express.json());

// ─── In-Memory Cache ───────────────────────────────────────────────────────
class MemoryCache {
    constructor() {
        this.prices = {};
        this.baselines = {};
        this.alerts = [];
    }

    updatePrice(coinId, price, coinName, symbol) {
        const now = Date.now();
        const prev = this.prices[coinId];
        if (!this.baselines[coinId]) this.baselines[coinId] = price;
        this.prices[coinId] = { price, coinName, symbol, timestamp: now };
        if (!prev || now - prev.timestamp > 5 * 60 * 1000) this.baselines[coinId] = price;
        return prev ? prev.price : null;
    }

    getAll() {
        return this.prices;
    }

    getAlerts(limit = 100) {
        return this.alerts.slice(0, limit);
    }

    addAlert(alert) {
        this.alerts.unshift({ ...alert, id: Date.now().toString() });
        if (this.alerts.length > 100) this.alerts.pop();
    }

    // Coins in alert state in last 60s (doc §11.4 — status per asset for UI)
    getActiveAlertCoinIds() {
        const since = Date.now() - ALERT_COOLDOWN_MS;
        const ids = new Set();
        for (const a of this.alerts) {
            const t = typeof a.triggeredAt === "string" ? new Date(a.triggeredAt).getTime() : (a.triggeredAt?.getTime?.() || 0);
            if (t >= since) ids.add(a.coinId);
        }
        return ids;
    }
}

const ALERT_COOLDOWN_MS = 60000; // 1 min idempotency (per doc §15.2)

// ─── Flash Crash Detector (writes to DB with idempotency) ───────────────────
class FlashCrashDetector {
    constructor(cache, threshold = 2) {
        this.cache = cache;
        this.threshold = threshold;
    }

    async analyze(coinId, coinName, symbol, currentPrice) {
        const baseline = this.cache.baselines[coinId];
        if (!baseline) return null;

        const dropPercent = ((baseline - currentPrice) / baseline) * 100;

        if (dropPercent >= this.threshold) {
            const alert = {
                coinId,
                coinName,
                symbol,
                dropPercent: parseFloat(dropPercent.toFixed(2)),
                priceBefore: baseline,
                priceAfter: currentPrice,
                triggeredAt: new Date(),
            };

            // Idempotency: skip if we already created an alert for this asset in last 60s (doc §15.2)
            try {
                const existing = await prisma.cryptoAlert.findFirst({
                    where: {
                        coinId,
                        triggeredAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
                    },
                });
                if (existing) {
                    this.cache.addAlert({ ...alert, triggeredAt: alert.triggeredAt.toISOString() });
                    return null;
                }

                await prisma.cryptoAlert.create({
                    data: {
                        coinId: alert.coinId,
                        coinName: alert.coinName,
                        symbol: alert.symbol,
                        dropPercent: alert.dropPercent,
                        priceBefore: alert.priceBefore,
                        priceAfter: alert.priceAfter,
                    },
                });
            } catch (err) {
                console.error(`[${new Date().toISOString()}] [ERROR] Alert creation failed | Asset: ${coinId} |`, err.message);
            }

            this.cache.addAlert({ ...alert, triggeredAt: alert.triggeredAt.toISOString() });
            console.log(`[${new Date().toISOString()}] 🚨 FLASH CRASH | ${coinName} | Drop: ${dropPercent.toFixed(2)}% | Price: $${currentPrice}`);
            return alert;
        }
        return null;
    }
}

const cache = new MemoryCache();
const detector = new FlashCrashDetector(cache, 2);

// ─── CoinGecko fetch with retry & rate-limit handling (doc §11.2) ───────────
const COINS = [
    "bitcoin", "ethereum", "solana", "binancecoin", "ripple",
    "cardano", "avalanche-2", "dogecoin", "polkadot", "chainlink",
    "litecoin", "uniswap", "stellar", "cosmos", "tron",
];

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: { Accept: "application/json" },
            });
            if (response.status === 429) {
                const waitMs = Math.pow(2, i) * 1000;
                console.warn(`[${new Date().toISOString()}] Rate limited. Waiting ${waitMs}ms...`);
                await new Promise((r) => setTimeout(r, waitMs));
                continue;
            }
            return response.data;
        } catch (err) {
            const waitMs = Math.pow(2, i) * 1000;
            console.error(`[${new Date().toISOString()}] Attempt ${i + 1}/${retries} failed:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise((r) => setTimeout(r, waitMs));
        }
    }
    throw new Error("Max retries exceeded");
}

async function fetchMarketData() {
    try {
        const ids = COINS.join(",");
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`;

        const data = await fetchWithRetry(url);

        for (const [coinId, info] of Object.entries(data)) {
            const price = info.usd;
            const coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, " ");
            const symbol = coinId.substring(0, 3).toUpperCase();

            cache.updatePrice(coinId, price, coinName, symbol);
            await detector.analyze(coinId, coinName, symbol, price);
        }

        console.log(`[${new Date().toLocaleTimeString()}] Market data updated — ${Object.keys(data).length} coins`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to fetch market data:`, err.message);
    }
}

// ─── API Routes (doc §11.4: cache includes status 'stable' | 'alert') ────────
function pricesWithStatus() {
    const all = cache.getAll();
    const activeAlerts = cache.getActiveAlertCoinIds();
    const data = {};
    for (const [coinId, v] of Object.entries(all)) {
        data[coinId] = { ...v, status: activeAlerts.has(coinId) ? "alert" : "stable" };
    }
    return { success: true, data, timestamp: Date.now() };
}

app.get("/api/prices", (req, res) => {
    res.json(pricesWithStatus());
});

app.get("/api/alerts", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    res.json({ success: true, data: cache.getAlerts(limit) });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        coins: Object.keys(cache.prices).length,
        timestamp: Date.now(),
        cacheAge: Object.values(cache.prices)[0]?.timestamp ? Date.now() - Object.values(cache.prices)[0].timestamp : null,
    });
});

// Doc §12.3: Next.js reads from /cache when available
app.get("/cache", (req, res) => {
    res.json(pricesWithStatus());
});

// ─── Start Polling (30s per doc) ───────────────────────────────────────────
fetchMarketData();
setInterval(fetchMarketData, 30000);

app.listen(PORT, () => {
    console.log(`🛡️  Crypto Sentry surveillance engine running on port ${PORT}`);
    console.log(`📡 Monitoring ${COINS.length} cryptocurrencies`);
    console.log(`⚡ Flash crash threshold: 2% drop (Bitbash spec)`);
});
