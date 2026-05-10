import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_THRESHOLD_TYPES = [
  "CONVERSIONS",
  "CLICKS",
  "UNIQUE_CLICKS",
  "REVENUE_KOBO",
] as const;

async function authorizeBrandCampaign(userId: string, campaignId: string) {
  const brandProfile = await db.brandProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!brandProfile) return null;
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, brandId: brandProfile.id },
    select: { id: true },
  });
  if (!campaign) return null;
  return { brandProfileId: brandProfile.id, campaignId: campaign.id };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: campaignId } = await params;
  const ctx = await authorizeBrandCampaign(session.user.id, campaignId);
  if (!ctx) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const bonuses = await db.performanceBonus.findMany({
    where: { campaignId },
    orderBy: [{ paidAt: "asc" }, { earnedAt: "desc" }, { createdAt: "desc" }],
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ bonuses });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: campaignId } = await params;
  const ctx = await authorizeBrandCampaign(session.user.id, campaignId);
  if (!ctx) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { creatorId, threshold, thresholdType, bonusAmountKobo, notes } =
      body as {
        creatorId: string;
        threshold: number;
        thresholdType: (typeof VALID_THRESHOLD_TYPES)[number];
        bonusAmountKobo: number;
        notes?: string;
      };

    if (
      !creatorId ||
      typeof threshold !== "number" ||
      threshold <= 0 ||
      !VALID_THRESHOLD_TYPES.includes(thresholdType) ||
      typeof bonusAmountKobo !== "number" ||
      bonusAmountKobo <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "creatorId, threshold (>0), thresholdType, and bonusAmountKobo (>0) required",
        },
        { status: 400 }
      );
    }

    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const bonus = await db.performanceBonus.create({
      data: {
        campaignId,
        creatorId,
        threshold,
        thresholdType,
        bonusAmountKobo,
        notes: notes || null,
      },
    });

    return NextResponse.json({ bonus }, { status: 201 });
  } catch (error: any) {
    console.error("Create bonus error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create bonus" },
      { status: 500 }
    );
  }
}
