"use client";
import { useEffect, useState } from "react";

interface CoinData { price: number; coinName: string; symbol: string; timestamp: number; }

export default function MarketPage() {
    const [coins, setCoins] = useState<[string, CoinData][]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await fetch("/api/prices");
            const data = await res.json();
            if (data.success) setCoins(Object.entries(data.data));
            setLoading(false);
        }
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const filtered = coins.filter(([id, coin]) =>
        coin.coinName.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase()) ||
        id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>Market Overview</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>All monitored assets · Updated every 10s</p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "20px" }}>
                <input className="input-field" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍  Search by name or symbol..."
                    style={{ width: "100%", maxWidth: "420px", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem" }} />
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>Loading market data...</div>
            ) : (
                <div className="glass" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                {["Asset", "Symbol", "Price (USD)", "Last Updated"].map(col => (
                                    <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(([coinId, coin], i) => (
                                <tr key={coinId} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none", transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(56,189,248,0.04)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                                    <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: "0.9rem" }}>{coin.coinName}</td>
                                    <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{coin.symbol}</td>
                                    <td style={{ padding: "14px 20px", color: "var(--accent-cyan)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
                                        {coin.price >= 1 ? `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${coin.price.toFixed(6)}`}
                                    </td>
                                    <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        {new Date(coin.timestamp).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No coins match your search</div>
                    )}
                </div>
            )}
        </div>
    );
}
