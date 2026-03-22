import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/direct-hire/[id]/decline — creator declines a direct hire offer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offer = await db.directHireOffer.findUnique({
    where: { id: id },
    include: { campaign: true },
  });

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (offer.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Offer is no longer pending" }, { status: 400 });
  }

  const updatedOffer = await db.directHireOffer.update({
    where: { id: id },
    data: { status: "DECLINED" },
  });

  // Notify brand
  await db.notification.create({
    data: {
      userId: offer.brandId,
      type: "GENERAL",
      title: "Direct hire offer declined",
      body: `Creator declined your offer for "${offer.campaign.title}"`,
      actionUrl: `/brand/discover`,
    },
  });

  return NextResponse.json({ offer: updatedOffer });
}
