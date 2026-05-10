// Daily aggregation API - pre-compute daily stats into PerformanceMetric
// POST /api/cron/daily-aggregation (protected by cron secret)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "novaclio-cron-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    console.log(`Running daily aggregation for ${yesterday.toISOString().split("T")[0]}`);

    // Get all active tracking links
    const trackingLinks = await db.trackingLink.findMany({
      where: { isActive: true },
      select: {
        id: true,
        campaignId: true,
        creatorId: true,
      },
    });

    let processed = 0;
    let created = 0;

    for (const link of trackingLinks) {
      // Count clicks for yesterday
      const clicks = await db.linkClick.count({
        where: {
          trackingLinkId: link.id,
          timestamp: {
            gte: yesterday,
            lte: endOfYesterday,
          },
        },
      });

      // Count unique clicks (distinct ipHash)
      const uniqueClicks = await db.linkClick.groupBy({
        by: ["ipHash"],
        where: {
          trackingLinkId: link.id,
          timestamp: {
            gte: yesterday,
            lte: endOfYesterday,
          },
        },
      });

      // Count conversions for yesterday
      const conversions = await db.conversion.count({
        where: {
          trackingLinkId: link.id,
          createdAt: {
            gte: yesterday,
            lte: endOfYesterday,
          },
        },
      });

      // Sum revenue for yesterday
      const revenueAgg = await db.conversion.aggregate({
        where: {
          trackingLinkId: link.id,
          createdAt: {
            gte: yesterday,
            lte: endOfYesterday,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // Only create metric if there was activity
      if (clicks > 0 || conversions > 0) {
        // Upsert the daily performance metric
        try {
          await db.performanceMetric.create({
            data: {
              trackingLinkId: link.id,
              date: yesterday,
              clicks,
              uniqueClicks: uniqueClicks.length,
              conversions,
              revenue: revenueAgg._sum.amount || 0,
            },
          });
          created++;
        } catch (e: any) {
          // If unique constraint violation, update instead
          if (e.code === "P2002") {
            await db.performanceMetric.updateMany({
              where: {
                trackingLinkId: link.id,
                date: yesterday,
              },
              data: {
                clicks,
                uniqueClicks: uniqueClicks.length,
                conversions,
                revenue: revenueAgg._sum.amount || 0,
              },
            });
          } else {
            console.error(`Metric creation failed for link ${link.id}:`, e);
          }
        }
      }

      processed++;
    }

    // Sync Redis click counters back to DB
    try {
      const Redis = (await import("ioredis")).default;
      const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
      const keys = await redis.keys("tracking:link:*:clicks");

      for (const key of keys) {
        const shortCode = key.split(":")[2];
        const clickCount = parseInt(await redis.get(key) || "0", 10);

        if (clickCount > 0) {
          // Find the tracking link
          const tl = await db.trackingLink.findUnique({
            where: { shortCode },
            select: { id: true, totalClicks: true },
          });

          if (tl) {
            // Sync if Redis count is higher
            if (clickCount > tl.totalClicks) {
              await db.trackingLink.update({
                where: { id: tl.id },
                data: { totalClicks: clickCount },
              });
            }
          }

          // Reset Redis counter
          await redis.del(key);
        }
      }

      await redis.quit();
    } catch (redisErr) {
      console.error("Redis sync error (non-critical):", redisErr);
    }

    return NextResponse.json({
      success: true,
      date: yesterday.toISOString().split("T")[0],
      linksProcessed: processed,
      metricsCreated: created,
    });
  } catch (error: any) {
    console.error("Daily aggregation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
