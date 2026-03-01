"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); }
        else router.push("/login?registered=1");
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass animate-fade-up" style={{ width: "100%", maxWidth: "420px", borderRadius: "20px", padding: "40px" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🛡️</div>
                    <h1 className="gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>Create Account</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "6px" }}>Join the Crypto Sentry terminal</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {["Name", "Email", "Password"].map((label, i) => (
                        <div key={label}>
                            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>{label}</label>
                            <input className="input-field"
                                type={label === "Password" ? "password" : label === "Email" ? "email" : "text"}
                                value={i === 0 ? name : i === 1 ? email : password}
                                onChange={e => i === 0 ? setName(e.target.value) : i === 1 ? setEmail(e.target.value) : setPassword(e.target.value)}
                                placeholder={label === "Name" ? "John Doe" : label === "Email" ? "you@example.com" : "••••••••"}
                                required={label !== "Name"}
                                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem" }} />
                        </div>
                    ))}

                    {error && (
                        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", padding: "10px 14px", color: "var(--accent-red)", fontSize: "0.85rem" }}>
                            {error}
                        </div>
                    )}

                    <button className="btn-primary" type="submit" disabled={loading}
                        style={{ padding: "13px", borderRadius: "10px", fontSize: "0.95rem", marginTop: "4px" }}>
                        {loading ? "Creating account..." : "Create Account →"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
