// Creator tracking links API
// GET /api/creator/tracking-links â get all links for the logged-in creator
// Includes QR code generation

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

    const links = await db.trackingLink.findMany({
      where: { creatorId: session.user.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            clicks: true,
            conversions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add tracking URL to each link
    const linksWithUrls = links.map((link) => ({
      ...link,
      trackingUrl: `https://novaclio.io/go/${link.shortCode}`,
      qrCodeUrl: link.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://novaclio.io/go/${link.shortCode}`)}`,
    }));

    return NextResponse.json({ links: linksWithUrls });
  } catch (error: any) {
    console.error("Creator tracking-links error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
