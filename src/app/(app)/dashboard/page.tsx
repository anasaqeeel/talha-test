"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import AnimatedPriceCard from "@/components/AnimatedPriceCard";
import StaleDataBanner from "@/components/StaleDataBanner";
import OnboardingSpotlight from "@/components/OnboardingSpotlight";

interface CoinData {
    price: number;
    coinName: string;
    symbol: string;
    timestamp: number;
    status?: "stable" | "alert";
}

interface PricesResponse {
    success: boolean;
    data: Record<string, CoinData>;
    timestamp: number;
    error?: string;
}

interface WatchlistEntry { id: string; coinId: string; coinName: string; symbol: string; }

export default function DashboardPage() {
    const { data: session } = useSession();
    const [pricesData, setPricesData] = useState<PricesResponse | null>(null);
    const [watchlistEntries, setWatchlistEntries] = useState<WatchlistEntry[]>([]);
    const [offline, setOffline] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const watchlist = watchlistEntries.map((w) => w.coinId);

    const fetchPrices = useCallback(async () => {
        try {
            const res = await fetch("/api/prices");
            const data: PricesResponse = await res.json();
            if (data.success) { setPricesData(data); setOffline(false); setLastUpdate(new Date()); }
            else setOffline(true);
        } catch { setOffline(true); }
    }, []);

    const fetchWatchlist = useCallback(async () => {
        if (!session) return;
        const res = await fetch("/api/watchlist");
        const data = await res.json();
        if (Array.isArray(data)) setWatchlistEntries(data as WatchlistEntry[]);
    }, [session]);

    useEffect(() => { fetchPrices(); fetchWatchlist(); }, [fetchPrices, fetchWatchlist]);
    useEffect(() => { const interval = setInterval(fetchPrices, 5000); return () => clearInterval(interval); }, [fetchPrices]);

    async function handleToggleWatch(coinId: string, coinName: string, symbol: string) {
        const entry = watchlistEntries.find((w) => w.coinId === coinId);
        const isWatched = !!entry;
        if (isWatched && entry) {
            setWatchlistEntries((w) => w.filter((e) => e.coinId !== coinId));
            if (entry.id) await fetch(`/api/watchlist/${entry.id}`, { method: "DELETE" });
            else await fetch(`/api/watchlist?coinId=${coinId}`, { method: "DELETE" });
        } else {
            setWatchlistEntries((w) => [...w, { id: "", coinId, coinName, symbol }]);
            const res = await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coinId, coinName, symbol }) });
            const created = await res.json();
            if (created?.id) setWatchlistEntries((prev) => prev.map((e) => (e.coinId === coinId ? { ...e, id: created.id } : e)));
            else await fetchWatchlist();
        }
    }

    const coins = pricesData?.data ? Object.entries(pricesData.data) : [];

    return (
        <div>
            <OnboardingSpotlight />

            {/* Header — doc §17.1: id for onboarding "Dashboard Stats" */}
            <motion.div
                id="dashboard-stats"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
            >
                <div>
                    <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>Market Dashboard</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                        Live prices · {coins.length} coins · Auto-refreshes every 5s
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <motion.div
                        animate={{ scale: offline ? [1, 1.05, 1] : 1 }}
                        transition={{ repeat: offline ? Infinity : 0, duration: 2 }}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            background: offline ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.08)",
                            border: `1px solid ${offline ? "rgba(248,113,113,0.25)" : "rgba(52,211,153,0.2)"}`,
                            borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem",
                            color: offline ? "var(--accent-red)" : "var(--accent-green)",
                        }}
                    >
                        <span className={offline ? "status-dot-red" : "status-dot-green"}></span>
                        {offline ? "Engine Offline" : "Live"}
                    </motion.div>
                    {lastUpdate && <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Updated {lastUpdate.toLocaleTimeString()}</span>}
                </div>
            </motion.div>

            {/* Stale data / offline banner */}
            <StaleDataBanner lastUpdate={lastUpdate} isOffline={offline} />

            {/* Price grid */}
            {coins.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📡</div>
                    <p style={{ fontSize: "1rem" }}>Waiting for market data...</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>Make sure the surveillance engine is running</p>
                </motion.div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                    {coins.map(([coinId, coin], i) => (
                        <AnimatedPriceCard
                            key={coinId}
                            coinId={coinId}
                            coin={coin}
                            watchlist={watchlist}
                            onToggleWatch={handleToggleWatch}
                            index={i}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
