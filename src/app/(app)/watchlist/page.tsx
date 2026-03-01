"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WatchlistEntry { id: string; coinId: string; coinName: string; symbol: string; }

export default function WatchlistPage() {
    const [items, setItems] = useState<WatchlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);

    async function load() {
        const res = await fetch("/api/watchlist");
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function remove(entryId: string, coinId: string) {
        setRemoving(coinId);
        await fetch(`/api/watchlist/${entryId}`, { method: "DELETE" });
        setItems((prev) => prev.filter((i) => i.id !== entryId));
        setRemoving(null);
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>My Watchlist</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                    {items.length} asset{items.length !== 1 ? "s" : ""} tracked · Star coins on the Dashboard to add them
                </p>
            </div>

            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                    Loading watchlist...
                </motion.div>
            ) : items.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "80px 20px" }}>
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: "3rem", marginBottom: "16px" }}>⭐</motion.div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Your watchlist is empty</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "8px" }}>Star coins on the Dashboard to track them here</p>
                </motion.div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "14px" }}>
                    <AnimatePresence>
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ delay: i * 0.05, duration: 0.25 }}
                                style={{
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border-subtle)",
                                    backdropFilter: "blur(20px)",
                                    borderRadius: "14px",
                                    padding: "20px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>{item.symbol}</div>
                                    <div style={{ fontWeight: 600, marginTop: "4px" }}>{item.coinName}</div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => remove(item.id, item.coinId)}
                                    disabled={removing === item.coinId}
                                    style={{
                                        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                                        color: "var(--accent-red)", borderRadius: "8px", padding: "6px 10px",
                                        cursor: "pointer", fontSize: "0.8rem", fontFamily: "Inter,sans-serif",
                                        opacity: removing === item.coinId ? 0.5 : 1,
                                    }}
                                >
                                    {removing === item.coinId ? "..." : "Remove"}
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
