import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function authenticateApiKey(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.substring(7);
  const keyHash = hashKey(rawKey);

  const apiKey = await db.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      brand: { select: { id: true, userId: true, companyName: true } },
    },
  });

  if (apiKey) {
    // Update last used timestamp
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });
  }

  return apiKey;
}

// GET /api/v1/external?resource=campaigns|analytics|links
export async function GET(req: Request) {
  try {
    const apiKey = await authenticateApiKey(req);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Invalid or expired API key" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource");

    switch (resource) {
      case "campaigns": {
        if (!apiKey.scopes.includes("read:campaigns")) {
          return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
        }
        const campaigns = await db.campaign.findMany({
          where: { brandId: apiKey.brandId },
          include: {
            _count: { select: { trackingLinks: true, proposals: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ campaigns, count: campaigns.length });
      }

      case "analytics": {
        if (!apiKey.scopes.includes("read:analytics")) {
          return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
        }
        const links = await db.trackingLink.findMany({
          where: { campaign: { brandId: apiKey.brandId } },
          include: {
            _count: { select: { clicks: true, conversions: true } },
            campaign: { select: { title: true, id: true } },
          },
        });

        const totalClicks = links.reduce((s, l) => s + l.totalClicks, 0);
        const uniqueClicks = links.reduce((s, l) => s + l.uniqueClicks, 0);
        const totalConversions = links.reduce((s, l) => s + l._count.conversions, 0);

        const revenueResult = await db.conversion.aggregate({
          where: { trackingLink: { campaign: { brandId: apiKey.brandId } } },
          _sum: { value: true },
        });

        return NextResponse.json({
          summary: {
            totalLinks: links.length,
            totalClicks,
            uniqueClicks,
            totalConversions,
            totalRevenue: revenueResult._sum.value || 0,
            conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00",
          },
          links: links.map((l) => ({
            id: l.id,
            shortCode: l.shortCode,
            destinationUrl: l.destinationUrl,
            campaign: l.campaign.title,
            totalClicks: l.totalClicks,
            uniqueClicks: l.uniqueClicks,
            conversions: l._count.conversions,
            isActive: l.isActive,
            createdAt: l.createdAt,
          })),
        });
      }

      case "links": {
        if (!apiKey.scopes.includes("read:analytics")) {
          return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
        }
        const campaignId = searchParams.get("campaignId");
        const trackingLinks = await db.trackingLink.findMany({
          where: {
            campaign: { brandId: apiKey.brandId },
            ...(campaignId ? { campaignId } : {}),
          },
          include: {
            _count: { select: { clicks: true, conversions: true } },
            creator: { select: { name: true } },
            campaign: { select: { title: true } },
          },
          orderBy: { totalClicks: "desc" },
        });

        return NextResponse.json({
          links: trackingLinks.map((l) => ({
            id: l.id,
            shortCode: l.shortCode,
            destinationUrl: l.destinationUrl,
            creator: l.creator.name,
            campaign: l.campaign.title,
            totalClicks: l.totalClicks,
            uniqueClicks: l.uniqueClicks,
            conversions: l._count.conversions,
            isActive: l.isActive,
            createdAt: l.createdAt,
          })),
          count: trackingLinks.length,
        });
      }

      default:
        return NextResponse.json(
          {
            error: "Invalid resource. Use: campaigns, analytics, or links",
            docs: {
              endpoints: [
                "GET /api/v1/external?resource=campaigns",
                "GET /api/v1/external?resource=analytics",
                "GET /api/v1/external?resource=links&campaignId=optional",
              ],
              authentication: "Bearer token in Authorization header",
            },
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("External API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
