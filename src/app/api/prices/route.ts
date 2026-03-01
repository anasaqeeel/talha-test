import { NextResponse } from "next/server";

const SURVEILLANCE_URL = process.env.NEXT_PUBLIC_SURVEILLANCE_URL || "http://localhost:4000";

export async function GET() {
    try {
        const res = await fetch(`${SURVEILLANCE_URL}/api/prices`, { cache: "no-store" });
        if (!res.ok) throw new Error("Surveillance engine unreachable");
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { success: false, error: "Surveillance engine offline. Start with: npm run dev:server" },
            { status: 503 }
        );
    }
}
