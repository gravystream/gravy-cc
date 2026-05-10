import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }
    const campaigns = await db.campaign.findMany({
      where: { brandId: brandProfile.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns });
  } catch (e) {
    console.error("Brand campaigns error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
