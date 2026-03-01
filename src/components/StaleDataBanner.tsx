"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
    lastUpdate: Date | null;
    isOffline: boolean;
}

export default function StaleDataBanner({ lastUpdate, isOffline }: Props) {
    const [age, setAge] = useState(0);

    // Tick every second to update the age display
    useEffect(() => {
        const t = setInterval(() => {
            if (lastUpdate) setAge(Math.round((Date.now() - lastUpdate.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(t);
    }, [lastUpdate]);

    // PDF spec: warn after 60 seconds of no update
    const isStale = lastUpdate ? Date.now() - lastUpdate.getTime() > 60_000 : false;
    const show = isOffline || isStale;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -16, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -16, height: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    style={{
                        background: isOffline ? "rgba(248,113,113,0.08)" : "rgba(251,146,60,0.08)",
                        border: `1px solid ${isOffline ? "rgba(248,113,113,0.25)" : "rgba(251,146,60,0.25)"}`,
                        borderRadius: "12px",
                        padding: "12px 18px",
                        marginBottom: "20px",
                        color: isOffline ? "var(--accent-red)" : "var(--accent-orange)",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <span style={{ fontSize: "1rem" }}>{isOffline ? "🔴" : "🟡"}</span>
                    <span>
                        {isOffline
                            ? "Surveillance engine is offline — run node server.js to restart"
                            : `Data is ${age}s old — Surveillance engine may be offline`}
                    </span>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginLeft: "auto", background: "transparent",
                            border: `1px solid ${isOffline ? "rgba(248,113,113,0.3)" : "rgba(251,146,60,0.3)"}`,
                            color: "inherit", borderRadius: "6px", padding: "3px 10px",
                            cursor: "pointer", fontSize: "0.75rem", fontFamily: "Inter,sans-serif",
                        }}
                    >
                        Refresh
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
