import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/direct-hire — brand sends a direct hire offer to a creator
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "BRAND") {
    return NextResponse.json({ error: "Only brands can send direct hire offers" }, { status: 403 });
  }

  const {
    creatorId, title, description, budgetKobo,
    daysToComplete, niche, platform,
  } = await req.json();

  if (!creatorId || !title || !budgetKobo) {
    return NextResponse.json(
      { error: "creatorId, title, and budgetKobo are required" },
      { status: 400 }
    );
  }

  // Verify creator exists
  const creator = await db.creatorProfile.findUnique({ where: { userId: creatorId } });
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const brandProfile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });

  const result = await db.$transaction(async (tx) => {
    // Create a DIRECT_HIRE campaign
    const campaign = await tx.campaign.create({
      data: {
        userId: session.user.id,
        title,
        description: description ?? "",
        budgetKobo,
        type: "DIRECT_HIRE",
        status: "ACTIVE",
        niche: niche ?? "",
        platform: platform ?? "",
        deadline: new Date(Date.now() + (daysToComplete ?? 7) * 24 * 60 * 60 * 1000),
      },
    });

    // Create direct hire offer
    const offer = await tx.directHireOffer.create({
      data: {
        campaignId: campaign.id,
        creatorId,
        brandId: session.user.id,
        offerRateKobo: budgetKobo,
        message: description ?? "",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days to respond
      },
    });

    // Notify creator
    await tx.notification.create({
      data: {
        userId: creatorId,
        type: "DIRECT_HIRE_OFFER",
        title: "💼 New direct hire offer",
        body: `${brandProfile?.companyName ?? "A brand"} wants to hire you for "${title}" — ₦${(budgetKobo / 100).toLocaleString()}`,
        actionUrl: `/creator/offers/${offer.id}`,
      },
    });

    return { offer, campaign };
  });

  return NextResponse.json(result, { status: 201 });
}

// GET /api/direct-hire — list offers for current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  const where = user?.role === "CREATOR"
    ? { creatorId: session.user.id }
    : { brandId: session.user.id };

  const offers = await db.directHireOffer.findMany({
    where,
    include: {
      campaign: { select: { title: true, budgetKobo: true, deadline: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ offers });
}
