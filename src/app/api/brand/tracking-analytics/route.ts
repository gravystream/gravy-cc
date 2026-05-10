import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    // Get all tracking links across all brand campaigns with clicks and conversions
    const links = await db.trackingLink.findMany({
      where: {
        campaign: { brandId: brandProfile.id },
      },
      include: {
        _count: { select: { conversions: true } },
        clicks: {
          select: {
            timestamp: true,
            device: true,
            browser: true,
            country: true,
            referrer: true,
          },
        },
        creator: {
          select: {
            name: true,
            creatorProfile: { select: { displayName: true } },
          },
        },
        campaign: { select: { title: true } },
      },
      orderBy: { totalClicks: "desc" },
    });

    // Aggregate totals
    let totalClicks = 0;
    let uniqueClicks = 0;
    let totalConversions = 0;
    const allClicks: Array<{
      timestamp: Date;
      device: string;
      browser: string;
      country: string;
      referrer: string;
    }> = [];

    for (const link of links) {
      totalClicks += link.totalClicks;
      uniqueClicks += link.uniqueClicks;
      totalConversions += link._count.conversions;
      allClicks.push(...link.clicks);
    }

    const revenueResult = await db.conversion.aggregate({
      where: {
        trackingLink: {
          campaign: { brandId: brandProfile.id },
        },
      },
      _sum: { value: true },
    });
    const totalRevenue = revenueResult._sum.value || 0;

    return NextResponse.json({
      links,
      clicks: allClicks,
      totalClicks,
      uniqueClicks,
      totalConversions,
      totalRevenue,
    });
  } catch (error: any) {
    console.error("Brand tracking analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
