import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get campaignId from query params
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID required" },
        { status: 400 }
      );
    }

    // Get brand profile for the user
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: "Brand profile not found" },
        { status: 404 }
      );
    }

    // Fetch campaign with all tracking links and clicks
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        trackingLinks: {
          include: {
            clicks: true,
            conversions: true,
          },
        },
      },
    });

    if (!campaign || campaign.brandId !== brandProfile.id) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Calculate aggregated analytics
    const allClicks = campaign.trackingLinks.flatMap((link) => link.clicks);
    const allConversions = campaign.trackingLinks.flatMap((link) => link.conversions);

    // Build breakdowns
    const breakdowns = {
      device: {} as Record<string, number>,
      browser: {} as Record<string, number>,
      country: {} as Record<string, number>,
    };

    for (const click of allClicks) {
      if (click.device) {
        breakdowns.device[click.device] = (breakdowns.device[click.device] || 0) + 1;
      }
      if (click.browser) {
        breakdowns.browser[click.browser] = (breakdowns.browser[click.browser] || 0) + 1;
      }
      if (click.country) {
        breakdowns.country[click.country] = (breakdowns.country[click.country] || 0) + 1;
      }
    }

    // Build clicks by day
    const clicksByDay: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      clicksByDay[dateStr] = 0;
    }

    for (const click of allClicks) {
      const dateStr = new Date(click.timestamp).toISOString().split("T")[0];
      if (dateStr in clicksByDay) {
        clicksByDay[dateStr]++;
      }
    }

    const clicksByDayArray = Object.entries(clicksByDay).map(([date, clicks]) => ({
      date,
      clicks,
    }));

    // Calculate totals
    const totalClicks = allClicks.length;
    const totalConversions = allConversions.length;
    const totalRevenue = allConversions.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalLinks = campaign.trackingLinks.length;

    return NextResponse.json({
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      budget: campaign.budget,
      totalLinks,
      totalClicks,
      totalConversions,
      totalRevenue,
      links: campaign.trackingLinks.map((link) => ({
        id: link.id,
        shortCode: link.shortCode,
        destinationUrl: link.destinationUrl,
        totalClicks: link.clicks.length,
        uniqueClicks: link.uniqueClicks,
        isActive: link.isActive,
        createdAt: link.createdAt,
      })),
      breakdowns,
      clicksByDay: clicksByDayArray,
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
