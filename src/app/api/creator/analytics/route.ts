import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await db.trackingLink.findMany({
      where: { creatorId: session.user.id },
      include: {
        _count: { select: { conversions: true } },
        clicks: {
          select: { timestamp: true, device: true, browser: true, country: true, referrer: true },
        },
        conversions: {
          select: { id: true, type: true, value: true, timestamp: true },
          orderBy: { timestamp: "desc" },
          take: 50,
        },
        campaign: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalClicks = 0;
    let uniqueClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    for (const link of links) {
      totalClicks += link.totalClicks;
      uniqueClicks += link.uniqueClicks;
      totalConversions += link._count.conversions;
    }

    const revenueResult = await db.conversion.aggregate({
      where: {
        trackingLink: { creatorId: session.user.id },
      },
      _sum: { value: true },
    });
    totalRevenue = revenueResult._sum.value || 0;

    return NextResponse.json({
      links,
      totalClicks,
      uniqueClicks,
      totalConversions,
      totalRevenue,
    });
  } catch (error: any) {
    console.error("Creator analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
