import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyNewBrief } from "@/lib/email-notifications";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche");
    const campaigns = await db.campaign.findMany({
      where: { status: "ACTIVE", ...(niche ? { niche: { has: niche } } : {}) },
      include: { brand: { include: { user: { select: { name: true, email: true } } } }, proposals: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brand = await db.brandProfile.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const body = await req.json();
    const campaign = await db.campaign.create({
      data: {
        brandId: brand.id,
        title: body.title,
        description: body.description,
        budgetKobo: Math.round(body.budget * 100),
        deadline: new Date(body.deadline),
        niche: body.niche || [],
        platforms: body.platforms || [],
        requirements: body.requirements,
      },
    });
    // Email notify qualified creators about new brief
    try {
      const creators = await db.creatorProfile.findMany({
        where: { isVerified: true },
        include: { user: { select: { email: true, name: true } } },
        take: 50,
      });
      await Promise.allSettled(
        creators.map((c) =>
          c.user?.email
            ? notifyNewBrief(c.user.email, c.user.name || "Creator", campaign.title || "New Campaign", campaign.id)
            : Promise.resolve()
        )
      );
    } catch (emailErr) { console.error("Email notification failed:", emailErr); }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
