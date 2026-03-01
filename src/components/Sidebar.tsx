"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
    { href: "/dashboard", icon: "📊", label: "Dashboard", id: "nav-dashboard" },
    { href: "/market", icon: "🌐", label: "Market", id: "nav-market" },
    { href: "/watchlist", icon: "⭐", label: "Watchlist", id: "nav-watchlist" },
    { href: "/alerts", icon: "🚨", label: "Alerts", id: "nav-alerts" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [pingCount, setPingCount] = useState(0);

    // Poll alert count for badge
    useEffect(() => {
        async function fetchAlerts() {
            const res = await fetch("/api/alerts");
            const data = await res.json();
            if (data.success) setPingCount(data.data.length);
        }
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
                width: "220px", minHeight: "100vh", flexShrink: 0,
                background: "rgba(7,20,40,0.95)",
                borderRight: "1px solid var(--border-subtle)",
                display: "flex", flexDirection: "column",
                padding: "24px 0",
            }}
        >
            {/* Logo */}
            <div style={{ padding: "0 20px 28px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <motion.span
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        style={{ fontSize: "1.5rem", display: "inline-block" }}
                    >🛡️</motion.span>
                    <div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Crypto Sentry</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>by Bitbash</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {navItems.map(({ href, icon, label, id }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} style={{ textDecoration: "none" }}>
                            <motion.div
                                id={id}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "10px 14px", borderRadius: "10px",
                                    background: active ? "rgba(56,189,248,0.12)" : "transparent",
                                    border: `1px solid ${active ? "rgba(56,189,248,0.25)" : "transparent"}`,
                                    color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
                                    fontWeight: active ? 600 : 400,
                                    fontSize: "0.875rem",
                                    cursor: "pointer",
                                    position: "relative",
                                }}
                            >
                                <span style={{ fontSize: "1rem" }}>{icon}</span>
                                {label}
                                {/* Alert badge */}
                                {label === "Alerts" && pingCount > 0 && (
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            marginLeft: "auto",
                                            background: "var(--accent-red)",
                                            color: "white",
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            padding: "1px 6px",
                                            minWidth: "18px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {pingCount > 99 ? "99+" : pingCount}
                                    </motion.span>
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Profile / Sign out — doc §17.1: id for onboarding "Profile Menu" */}
            <div id="nav-profile" style={{ padding: "0 12px" }}>
                <motion.button
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 14px", borderRadius: "10px",
                        background: "transparent", border: "1px solid transparent",
                        color: "var(--text-secondary)", fontSize: "0.875rem", cursor: "pointer",
                        fontFamily: "Inter, sans-serif", transition: "color 0.2s",
                    }}
                >
                    <span>🚪</span> Sign Out
                </motion.button>
            </div>
        </motion.aside>
    );
}
