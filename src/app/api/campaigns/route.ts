import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brand = await db.brand.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const body = await req.json();
    const campaign = await db.campaign.create({
      data: {
        brandId: brand.id,
        title: body.title,
        description: body.description,
        budget: body.budget,
        deadline: new Date(body.deadline),
        niche: body.niche || [],
        platforms: body.platforms || [],
        requirements: body.requirements,
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
