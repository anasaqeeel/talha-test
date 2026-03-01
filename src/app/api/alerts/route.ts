import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SURVEILLANCE_URL = process.env.NEXT_PUBLIC_SURVEILLANCE_URL || "http://localhost:4000";

export async function GET() {
    try {
        const res = await fetch(`${SURVEILLANCE_URL}/api/alerts`, { cache: "no-store" });
        if (!res.ok) throw new Error("Surveillance engine unreachable");
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        // Fallback to DB when surveillance engine is offline (doc §12.3)
        try {
            const alerts = await prisma.cryptoAlert.findMany({
                orderBy: { triggeredAt: "desc" },
                take: 50,
            });
            const data = alerts.map((a) => ({
                id: a.id,
                coinId: a.coinId,
                coinName: a.coinName,
                symbol: a.symbol,
                dropPercent: a.dropPercent,
                priceBefore: a.priceBefore,
                priceAfter: a.priceAfter,
                triggeredAt: a.triggeredAt.toISOString(),
            }));
            return NextResponse.json({ success: true, data });
        } catch (dbErr) {
            return NextResponse.json(
                { success: false, error: "Surveillance engine offline" },
                { status: 503 }
            );
        }
    }
}
