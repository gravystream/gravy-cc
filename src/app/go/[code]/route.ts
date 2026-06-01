import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCachedLink, setCachedLink, incrementClickCounter } from "@/lib/tracking/link-cache";
import { enqueueClick } from "@/lib/tracking/click-queue";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // 1. Check Redis cache first
    let link = await getCachedLink(code);

    // 2. Cache miss â hit DB
    if (!link) {
      const dbLink = await db.trackingLink.findUnique({
        where: { shortCode: code },
        select: {
          id: true,
          shortCode: true,
          destinationUrl: true,
          isActive: true,
          expiresAt: true,
          maxClicks: true,
          totalClicks: true,
          campaignId: true,
          creatorId: true,
        },
      });

      if (!dbLink) {
        return NextResponse.redirect(new URL("/404", request.url));
      }

      // Cache the link for future requests
      await setCachedLink(code, {
        id: dbLink.id,
        shortCode: dbLink.shortCode,
        destinationUrl: dbLink.destinationUrl,
        isActive: dbLink.isActive,
        expiresAt: dbLink.expiresAt ? dbLink.expiresAt.toISOString() : null,
        maxClicks: dbLink.maxClicks,
        totalClicks: dbLink.totalClicks,
        campaignId: dbLink.campaignId,
        creatorId: dbLink.creatorId,
      });

      link = {
        id: dbLink.id,
        shortCode: dbLink.shortCode,
        destinationUrl: dbLink.destinationUrl,
        isActive: dbLink.isActive,
        expiresAt: dbLink.expiresAt ? dbLink.expiresAt.toISOString() : null,
        maxClicks: dbLink.maxClicks,
        totalClicks: dbLink.totalClicks,
        campaignId: dbLink.campaignId,
        creatorId: dbLink.creatorId,
      };
    }

    // 3. Check if link is active
    if (!link.isActive) {
      return NextResponse.redirect(new URL("/link-inactive", request.url));
    }

    // 4. Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.redirect(new URL("/link-expired", request.url));
    }

    // 5. Check max clicks
    if (link.maxClicks && link.totalClicks >= link.maxClicks) {
      return NextResponse.redirect(new URL("/link-expired", request.url));
    }

    // 6. Increment click counter in Redis (fast, non-blocking)
    await incrementClickCounter(code);

    // 7. Enqueue async click logging (BullMQ) â non-blocking
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    enqueueClick({
      trackingLinkId: link.id,
      ip,
      userAgent,
      referrer,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error("Failed to enqueue click:", err));

    // 8. Redirect to destination
    return NextResponse.redirect(link.destinationUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
