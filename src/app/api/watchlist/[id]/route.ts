import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/watchlist/[id] — remove by watchlist entry id (doc §9, §16.1)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Entry id required" }, { status: 400 });

    try {
        const entry = await prisma.watchlist.findUnique({ where: { id } });
        if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (entry.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.watchlist.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
    }
}
