import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }
    const campaigns = await db.campaign.findMany({
      where: { brandId: brandProfile.id },
      select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);
    if (campaignIds.length === 0) {
      return NextResponse.json({ links: [] });
    }
    const links = await db.trackingLink.findMany({
      where: { campaignId: { in: campaignIds } },
      include: {
        campaign: { select: { title: true } },
        clicks: {
          select: { id: true, device: true, browser: true, country: true, os: true, referrer: true, timestamp: true },
          orderBy: { timestamp: "desc" },
          take: 50,
        },
        _count: { select: { conversions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links });
  } catch (e) {
    console.error("Brand tracking-links error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }
    const body = await req.json();
    const { id, ...updates } = body;
    const link = await db.trackingLink.findFirst({
      where: { id },
      include: { campaign: { select: { brandId: true } } },
    });
    if (!link || link.campaign?.brandId !== brandProfile.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    const data = {};
    if (typeof updates.isActive === "boolean") data.isActive = updates.isActive;
    if (updates.destinationUrl) data.destinationUrl = updates.destinationUrl;
    if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (updates.maxClicks !== undefined) data.maxClicks = updates.maxClicks ? parseInt(updates.maxClicks) : null;
    const updated = await db.trackingLink.update({ where: { id }, data });
    return NextResponse.json({ link: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }
    const { id } = await req.json();
    const link = await db.trackingLink.findFirst({
      where: { id },
      include: { campaign: { select: { brandId: true } } },
    });
    if (!link || link.campaign?.brandId !== brandProfile.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    await db.trackingLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
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

    const body = await req.json();
    const { campaignId, creatorId, destinationUrl, linkType, utmSource, utmMedium, utmCampaign, utmContent, expiresAt, maxClicks } = body;

    if (!campaignId || !destinationUrl) {
      return NextResponse.json({ error: "Campaign and destination URL are required" }, { status: 400 });
    }

    // Verify campaign belongs to this brand
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, brandId: brandProfile.id },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // If creatorId provided, verify they exist
    if (creatorId) {
      const creator = await db.user.findUnique({ where: { id: creatorId } });
      if (!creator) {
        return NextResponse.json({ error: "Creator not found" }, { status: 404 });
      }
    }

    // Generate unique short code
    const { generateUniqueShortCode } = await import("@/lib/shortcode");
    const shortCode = await generateUniqueShortCode();

    const link = await db.trackingLink.create({
      data: {
        shortCode,
        creatorId: creatorId || session.user.id,
        campaignId,
        destinationUrl,
        linkType: linkType || "website",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxClicks: maxClicks ? parseInt(maxClicks) : null,
      },
      include: {
        campaign: { select: { title: true } },
      },
    });

    return NextResponse.json({ success: true, link }, { status: 201 });
  } catch (error: any) {
    console.error("Create tracking link error:", error);
    return NextResponse.json({ error: error.message || "Failed to create link" }, { status: 500 });
  }
}