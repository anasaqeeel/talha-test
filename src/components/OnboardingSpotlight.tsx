"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Doc §17.1: 5 steps — Dashboard Stats, Nav Alerts, Watchlist, Market Search, Profile Menu
const STEPS = [
    { targetId: null, title: "Welcome to Crypto Sentry 🛡️", body: "Your real-time market surveillance terminal — monitoring flash crashes 24/7." },
    { targetId: "dashboard-stats", title: "Dashboard Stats 📊", body: "Market overview: live prices refresh every 5s. Green = stable, red = protocol violation (≥2% drop)." },
    { targetId: "nav-alerts", title: "Flash Crash Alerts 🚨", body: "Any coin dropping ≥2% in 30s triggers an alert. View history here." },
    { targetId: "nav-watchlist", title: "Watchlist ⭐", body: "Star assets on the dashboard or market page to track them here." },
    { targetId: "nav-market", title: "Market Overview 🌐", body: "Search all monitored assets by name or symbol. Add to watchlist from here." },
    { targetId: "nav-profile", title: "Profile & Sign Out 🚪", body: "Sign out or manage your account from here." },
];

interface Rect { top: number; left: number; width: number; height: number; }

const PAD = 10;

export default function OnboardingSpotlight() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!localStorage.getItem("cs_onboarding_done")) {
            setTimeout(() => setVisible(true), 900);
        }
    }, []);

    // Track the target element's bounding rect
    useEffect(() => {
        if (!visible) return;
        const id = STEPS[step].targetId;
        if (!id) { setRect(null); return; }
        const el = document.getElementById(id);
        if (el) {
            const r = el.getBoundingClientRect();
            setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
        } else {
            setRect(null);
        }
    }, [step, visible]);

    function next() {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else finish();
    }
    function finish() {
        localStorage.setItem("cs_onboarding_done", "1");
        setVisible(false);
    }

    if (!visible) return null;

    const current = STEPS[step];

    // Build clip-path that punches a hole where the target element is
    const clipPath = rect
        ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%,
        0% ${rect.top}px,
        ${rect.left}px ${rect.top}px,
        ${rect.left}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top + rect.height}px,
        ${rect.left + rect.width}px ${rect.top}px,
        0% ${rect.top}px
      )`
        : undefined;

    // Popup position: below the highlighted element, or centered if no target
    const popupStyle: React.CSSProperties = rect
        ? {
            position: "fixed",
            top: Math.min(rect.top + rect.height + 16, window.innerHeight - 240),
            left: Math.max(rect.left, 12),
            maxWidth: "320px",
            zIndex: 1001,
        }
        : {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            maxWidth: "420px",
            zIndex: 1001,
        };

    return (
        <>
            {/* Dimmed overlay with clip-path cutout */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={finish}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(4,13,26,0.82)",
                    backdropFilter: "blur(2px)",
                    zIndex: 999,
                    transition: "clip-path 0.35s ease",
                    clipPath,
                }}
            />

            {/* Highlight border around target */}
            {rect && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: "fixed",
                        top: rect.top, left: rect.left,
                        width: rect.width, height: rect.height,
                        border: "2px solid var(--accent-cyan)",
                        borderRadius: "12px",
                        boxShadow: "0 0 20px rgba(56,189,248,0.4)",
                        zIndex: 1000,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Popup card */}
            <motion.div
                key={step}
                ref={popupRef}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{
                    ...popupStyle,
                    background: "rgba(7,20,40,0.97)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 0 40px rgba(56,189,248,0.15)",
                    width: "100%",
                }}
            >
                {/* Progress dots */}
                <div style={{ display: "flex", gap: "5px", marginBottom: "14px" }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            height: "4px",
                            width: i === step ? "24px" : "8px",
                            borderRadius: "2px",
                            background: i === step ? "var(--accent-cyan)" : "rgba(56,189,248,0.2)",
                            transition: "all 0.3s",
                        }} />
                    ))}
                </div>

                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>
                    {current.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "20px" }}>
                    {current.body}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={finish}
                        style={{
                            flex: 1, padding: "9px", borderRadius: "9px",
                            border: "1px solid var(--border-subtle)", background: "transparent",
                            color: "var(--text-secondary)", cursor: "pointer",
                            fontSize: "0.8rem", fontFamily: "Inter,sans-serif",
                        }}
                    >
                        Skip
                    </button>
                    <button
                        className="btn-primary"
                        onClick={next}
                        style={{ flex: 2, padding: "9px 16px", borderRadius: "9px", fontSize: "0.85rem" }}
                    >
                        {step < STEPS.length - 1 ? "Next →" : "Let's Go! 🚀"}
                    </button>
                </div>
            </motion.div>
        </>
    );
}
