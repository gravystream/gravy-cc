import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, brandId: brandProfile.id },
      select: { id: true, title: true, budgetKobo: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const links = await db.trackingLink.findMany({
      where: { campaignId },
      select: {
        id: true,
        creatorId: true,
        shortCode: true,
        totalClicks: true,
        uniqueClicks: true,
        creator: {
          select: {
            id: true,
            email: true,
            creatorProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                tier: true,
                isGravyArmy: true,
              },
            },
          },
        },
        _count: { select: { conversions: true } },
        conversions: {
          select: { value: true },
        },
      },
    });

    const perCreator = links.map((link) => {
      const totalRevenueKobo = link.conversions.reduce(
        (sum, c) => sum + (c.value ? Number(c.value) : 0),
        0
      );
      const conversions = link._count.conversions;
      const cpaKobo =
        conversions > 0 ? Math.round(campaign.budgetKobo / conversions) : 0;
      const conversionRate =
        link.totalClicks > 0 ? conversions / link.totalClicks : 0;

      return {
        trackingLinkId: link.id,
        shortCode: link.shortCode,
        creator: {
          id: link.creator.id,
          creatorProfileId: link.creator.creatorProfile?.id ?? null,
          displayName: link.creator.creatorProfile?.displayName ?? "Unknown",
          avatarUrl: link.creator.creatorProfile?.avatarUrl ?? null,
          tier: link.creator.creatorProfile?.tier ?? "BRONZE",
          isGravyArmy: link.creator.creatorProfile?.isGravyArmy ?? false,
        },
        clicks: link.totalClicks,
        uniqueClicks: link.uniqueClicks,
        conversions,
        conversionRate,
        cpaKobo,
        revenueKobo: totalRevenueKobo,
      };
    });

    perCreator.sort(
      (a, b) => b.conversions - a.conversions || b.clicks - a.clicks
    );

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        budgetKobo: campaign.budgetKobo,
      },
      perCreator,
      totals: {
        creators: perCreator.length,
        clicks: perCreator.reduce((s, c) => s + c.clicks, 0),
        conversions: perCreator.reduce((s, c) => s + c.conversions, 0),
        revenueKobo: perCreator.reduce((s, c) => s + c.revenueKobo, 0),
      },
    });
  } catch (error: any) {
    console.error("Per-creator ROI error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load per-creator ROI" },
      { status: 500 }
    );
  }
}
