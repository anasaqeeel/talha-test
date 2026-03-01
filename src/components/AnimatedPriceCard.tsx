"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface CoinData {
    price: number;
    coinName: string;
    symbol: string;
    timestamp: number;
    status?: "stable" | "alert"; // doc §11.4, §12.4
}

interface Props {
    coinId: string;
    coin: CoinData;
    watchlist: string[];
    onToggleWatch: (coinId: string, coinName: string, symbol: string) => void;
    index: number;
}

export default function AnimatedPriceCard({ coinId, coin, watchlist, onToggleWatch, index }: Props) {
    const isWatched = watchlist.includes(coinId);
    const prevPrice = useRef<number>(coin.price);
    const [flash, setFlash] = useState<"up" | "down" | null>(null);

    useEffect(() => {
        if (prevPrice.current !== coin.price) {
            setFlash(coin.price > prevPrice.current ? "up" : "down");
            prevPrice.current = coin.price;
            const t = setTimeout(() => setFlash(null), 900);
            return () => clearTimeout(t);
        }
    }, [coin.price]);

    const priceStr = coin.price >= 1
        ? `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${coin.price.toFixed(6)}`;

    const flashColor =
        flash === "up" ? "rgba(52,211,153,0.15)" :
            flash === "down" ? "rgba(248,113,113,0.15)" : "transparent";

    const priceColor =
        flash === "up" ? "var(--accent-green)" :
            flash === "down" ? "var(--accent-red)" : "var(--accent-cyan)";

    const isAlert = coin.status === "alert";
    const borderColor = isAlert ? "rgba(248,113,113,0.5)" : "rgba(52,211,153,0.35)";
    const glowColor = isAlert ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.08)";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
        >
            <motion.div
                animate={{
                    borderColor,
                    boxShadow: `0 0 24px ${glowColor}`,
                    backgroundColor: flashColor || (isAlert ? "rgba(248,113,113,0.04)" : "var(--bg-card)"),
                }}
                transition={{ duration: 0.3 }}
                style={{
                    borderRadius: "16px",
                    padding: "20px",
                    position: "relative",
                    border: `1px solid ${borderColor}`,
                    backdropFilter: "blur(20px)",
                    cursor: "default",
                }}
                whileHover={{ y: -2, boxShadow: `0 0 24px ${glowColor}` }}
            >
                {/* Doc §12.4: STABLE / PROTOCOL VIOLATION badge */}
                <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {isAlert ? (
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-red)", background: "rgba(248,113,113,0.15)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                            🚨 Protocol violation
                        </span>
                    ) : (
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-green)", background: "rgba(52,211,153,0.12)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                            Stable
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>
                            {coin.symbol}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", marginTop: "3px", fontWeight: 500 }}>{coin.coinName}</div>
                    </div>
                    <motion.button
                        onClick={() => onToggleWatch(coinId, coin.coinName, coin.symbol)}
                        whileTap={{ scale: 0.8 }}
                        whileHover={{ scale: 1.2 }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", opacity: isWatched ? 1 : 0.3, transition: "opacity 0.2s" }}
                        title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                    >
                        ⭐
                    </motion.button>
                </div>

                <motion.div
                    key={coin.price}
                    initial={{ scale: 1.04 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25 }}
                    style={{ marginTop: "14px", fontSize: "1.45rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: priceColor, transition: "color 0.4s ease" }}
                >
                    {priceStr}
                </motion.div>

                <AnimatePresence>
                    {flash && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
                                fontSize: "0.72rem", fontWeight: 700,
                                color: flash === "up" ? "var(--accent-green)" : "var(--accent-red)",
                                background: flash === "up" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                                border: `1px solid ${flash === "up" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                                borderRadius: "6px", padding: "2px 8px",
                                pointerEvents: "none", whiteSpace: "nowrap",
                            }}
                        >
                            {flash === "up" ? "▲ Tick Up" : "▼ Tick Down"}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
