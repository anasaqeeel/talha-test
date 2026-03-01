"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
    id: string;
    coinId: string;
    coinName: string;
    symbol: string;
    dropPercent: number;
    priceBefore: number;
    priceAfter: number;
    triggeredAt: string;
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAsset, setFilterAsset] = useState<string>("");

    useEffect(() => {
        async function load() {
            const res = await fetch("/api/alerts?limit=50");
            const data = await res.json();
            if (data.success) setAlerts(data.data);
            setLoading(false);
        }
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const uniqueAssets = useMemo(() => {
        const set = new Set(alerts.map((a) => a.coinId));
        return Array.from(set).sort();
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        if (!filterAsset) return alerts;
        return alerts.filter((a) => a.coinId === filterAsset);
    }, [alerts, filterAsset]);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>Flash Crash Alerts</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Triggered when a coin drops ≥2% within 30s · {filteredAlerts.length} event{filteredAlerts.length !== 1 ? "s" : ""}
                </p>
                {uniqueAssets.length > 0 && (
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Filter by asset:</label>
                        <select
                            value={filterAsset}
                            onChange={(e) => setFilterAsset(e.target.value)}
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                color: "var(--text-primary)",
                                fontSize: "0.85rem",
                            }}
                        >
                            <option value="">All</option>
                            {uniqueAssets.map((id) => {
                                const a = alerts.find((x) => x.coinId === id);
                                return <option key={id} value={id}>{a?.coinName ?? id}</option>;
                            })}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                    Loading alerts...
                </motion.div>
            ) : filteredAlerts.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>No flash crashes detected</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "8px" }}>Markets are stable — monitoring 24/7</p>
                </motion.div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AnimatePresence>
                        {filteredAlerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                style={{
                                    background: "var(--bg-card)",
                                    border: "1px solid rgba(248,113,113,0.2)",
                                    borderLeft: "3px solid var(--accent-red)",
                                    backdropFilter: "blur(20px)",
                                    borderRadius: "14px",
                                    padding: "18px 20px",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <motion.span
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.15 }}
                                                style={{ fontSize: "1.1rem" }}
                                            >🚨</motion.span>
                                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{alert.coinName}</span>
                                            <span style={{ background: "rgba(248,113,113,0.15)", color: "var(--accent-red)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 }}>
                                                -{alert.dropPercent}%
                                            </span>
                                        </div>
                                        <div style={{ marginTop: "10px", display: "flex", gap: "24px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                            <span>Before: <strong style={{ color: "var(--text-primary)" }}>${alert.priceBefore.toLocaleString()}</strong></span>
                                            <span>After: <strong style={{ color: "var(--accent-red)" }}>${alert.priceAfter.toLocaleString()}</strong></span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        {new Date(alert.triggeredAt).toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
