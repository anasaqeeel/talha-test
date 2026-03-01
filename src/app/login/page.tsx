"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error) { setError("Invalid email or password"); setLoading(false); }
        else router.push("/dashboard");
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass animate-fade-up" style={{ width: "100%", maxWidth: "420px", borderRadius: "20px", padding: "40px" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🛡️</div>
                    <h1 className="gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>
                        Crypto Sentry
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "6px" }}>Sign in to your surveillance terminal</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Email</label>
                        <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com" required
                            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Password</label>
                        <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem" }} />
                    </div>

                    {error && (
                        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", padding: "10px 14px", color: "var(--accent-red)", fontSize: "0.85rem" }}>
                            {error}
                        </div>
                    )}

                    <button className="btn-primary" type="submit" disabled={loading}
                        style={{ padding: "13px", borderRadius: "10px", fontSize: "0.95rem", marginTop: "4px" }}>
                        {loading ? "Signing in..." : "Sign In →"}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                        <span style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>or</span>
                        <span style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
                    </div>

                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        style={{
                            width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem",
                            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Sign in with Google
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    No account?{" "}
                    <Link href="/signup" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: 500 }}>Create one</Link>
                </p>
            </div>
        </div>
    );
}
