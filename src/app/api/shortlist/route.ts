import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "BRAND")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const brandProfile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });
    if (!brandProfile) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    const shortlists = await db.shortlist.findMany({
      where: { brandId: brandProfile.id },
      include: { creator: { include: { user: { select: { name: true, email: true, image: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(shortlists);
  } catch (error) {
    console.error("Error fetching shortlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "BRAND")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { creatorId } = await req.json();
    if (!creatorId) return NextResponse.json({ error: "creatorId required" }, { status: 400 });
    const brandProfile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });
    if (!brandProfile) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    const existing = await db.shortlist.findUnique({ where: { brandId_creatorId: { brandId: brandProfile.id, creatorId } } });
    if (existing) return NextResponse.json({ error: "Already shortlisted" }, { status: 409 });
    const shortlist = await db.shortlist.create({ data: { brandId: brandProfile.id, creatorId } });
    return NextResponse.json(shortlist, { status: 201 });
  } catch (error) {
    console.error("Error adding to shortlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "BRAND")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { creatorId } = await req.json();
    const brandProfile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });
    if (!brandProfile) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    await db.shortlist.delete({ where: { brandId_creatorId: { brandId: brandProfile.id, creatorId } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from shortlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
