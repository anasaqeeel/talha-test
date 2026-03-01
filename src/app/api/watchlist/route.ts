import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/watchlist — get user's watchlist
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const watchlist = await prisma.watchlist.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(watchlist);
}

// POST /api/watchlist — add coin to watchlist
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { coinId, coinName, symbol } = await req.json();

    try {
        const entry = await prisma.watchlist.create({
            data: { coinId, coinName, symbol, userId: session.user.id },
        });
        return NextResponse.json(entry, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
    }
}

// DELETE /api/watchlist?coinId=bitcoin — remove from watchlist
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const coinId = req.nextUrl.searchParams.get("coinId");
    if (!coinId) return NextResponse.json({ error: "coinId required" }, { status: 400 });

    await prisma.watchlist.deleteMany({
        where: { userId: session.user.id, coinId },
    });

    return NextResponse.json({ success: true });
}
