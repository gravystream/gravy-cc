// Activity Heatmap API
// GET /api/tracking-links/analytics/heatmap
// Returns a 7x24 matrix of click counts (rows = days, cols = hours)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const days = parseInt(searchParams.get("days") || "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Build where clause
    const where: any = {
      timestamp: { gte: since },
      trackingLink: {
        creatorId: session.user.id,
      },
    };

    if (campaignId) {
      where.trackingLink.campaignId = campaignId;
    }

    // Get all clicks within the time range
    const clicks = await db.linkClick.findMany({
      where,
      select: {
        timestamp: true,
      },
    });

    // Build the 7x24 matrix
    // Row 0 = Monday, Row 6 = Sunday
    // Col 0 = 12am (0:00), Col 23 = 11pm (23:00)
    const matrix: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );

    let totalClicks = 0;
    let maxCount = 0;

    for (const click of clicks) {
      const date = new Date(click.timestamp);
      // getDay() returns 0=Sunday, 1=Monday, etc.
      // We want 0=Monday, 6=Sunday
      let dayIndex = date.getDay() - 1;
      if (dayIndex < 0) dayIndex = 6; // Sunday becomes 6
      const hourIndex = date.getHours();

      matrix[dayIndex][hourIndex]++;
      totalClicks++;

      if (matrix[dayIndex][hourIndex] > maxCount) {
        maxCount = matrix[dayIndex][hourIndex];
      }
    }

    // Normalize to 0-1 scale
    const normalized: number[][] = matrix.map((row) =>
      row.map((count) => (maxCount > 0 ? Math.round((count / maxCount) * 100) / 100 : 0))
    );

    // Find peak time
    let peakDay = 0;
    let peakHour = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (matrix[d][h] > matrix[peakDay][peakHour]) {
          peakDay = d;
          peakHour = h;
        }
      }
    }

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return NextResponse.json({
      matrix,        // Raw counts
      normalized,    // 0-1 scale for color intensity
      totalClicks,
      maxCount,
      peakTime: {
        day: dayNames[peakDay],
        hour: peakHour,
        clicks: matrix[peakDay][peakHour],
      },
      days,
      dayLabels: dayNames,
      hourLabels: Array.from({ length: 24 }, (_, i) => {
        if (i === 0) return "12am";
        if (i < 12) return i + "am";
        if (i === 12) return "12pm";
        return (i - 12) + "pm";
      }),
    });
  } catch (error: any) {
    console.error("Heatmap API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
