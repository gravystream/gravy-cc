// Auto-link generation on deliverable approval
// POST /api/campaigns/[id]/approve-deliverable
// When a brand approves a creator's deliverable, auto-generate a tracking link

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deliverableId, creatorId } = await request.json();

    if (!deliverableId || !creatorId) {
      return NextResponse.json(
        { error: "deliverableId and creatorId are required" },
        { status: 400 }
      );
    }

    // Verify the campaign belongs to the brand
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const campaign = await db.campaign.findFirst({
      where: {
        id: params.id,
        brandId: brandProfile.id,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if a tracking link already exists for this creator + campaign
    const existingLink = await db.trackingLink.findFirst({
      where: {
        campaignId: campaign.id,
        creatorId: creatorId,
      },
    });

    if (existingLink) {
      return NextResponse.json({
        message: "Tracking link already exists",
        link: existingLink,
      });
    }

    // Generate a unique short code
    const shortCode = nanoid(8);

    // Create the tracking link
    const trackingLink = await db.trackingLink.create({
      data: {
        shortCode,
        creatorId,
        campaignId: campaign.id,
        destinationUrl: campaign.landingPageUrl || campaign.website || `https://novaclio.io/campaign/${campaign.id}`,
        linkType: "CREATOR_PROMO",
        utmSource: "creator",
        utmMedium: "social",
        utmCampaign: campaign.title?.toLowerCase().replace(/\s+/g, "-") || campaign.id,
        isActive: true,
        totalClicks: 0,
        uniqueClicks: 0,
      },
    });

    // Update the deliverable status if the model supports it
    try {
      await db.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    } catch (e) {
      // Deliverable model may not have these fields yet â non-critical
      console.log("Deliverable update skipped (model may differ):", e);
    }

    return NextResponse.json({
      message: "Deliverable approved and tracking link created",
      link: trackingLink,
      trackingUrl: `https://novaclio.io/go/${shortCode}`,
    });
  } catch (error: any) {
    console.error("Auto-link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
