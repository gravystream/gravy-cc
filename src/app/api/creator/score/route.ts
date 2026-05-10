import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function calculateTier(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 70) return "gold";
  if (score >= 50) return "silver";
  return "bronze";
}

// Compute creator performance score
async function computeScore(creatorProfileId: string) {
  const profile = await db.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    include: {
      user: {
        include: {
          trackingLinks: {
            include: {
              _count: { select: { clicks: true, conversions: true } },
            },
          },
        },
      },
    },
  });

  if (!profile) return null;

  // --- Engagement Score (0-100) ---
  // Based on click performance across all links
  const links = profile.user.trackingLinks || [];
  const totalClicks = links.reduce((sum, l) => sum + l.totalClicks, 0);
  const totalConversions = links.reduce((sum, l) => sum + l._count.conversions, 0);
  const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  // Engagement: scale convRate (0-10% maps to 0-100)
  const engagementScore = Math.min(100, convRate * 10);

  // --- Reliability Score (0-100) ---
  // Based on jobs completed and response time
  const jobsScore = Math.min(100, (profile.totalJobsCompleted / 20) * 100);
  const responseScore = profile.responseTimeHours <= 2
    ? 100
    : profile.responseTimeHours <= 6
    ? 80
    : profile.responseTimeHours <= 12
    ? 60
    : profile.responseTimeHours <= 24
    ? 40
    : 20;
  const reliabilityScore = jobsScore * 0.6 + responseScore * 0.4;

  // --- Quality Score (0-100) ---
  // Based on average rating and review count
  const ratingScore = (profile.avgRating / 5) * 100;
  const reviewBonus = Math.min(20, profile.totalReviews * 2);
  const qualityScore = Math.min(100, ratingScore * 0.8 + reviewBonus);

  // --- Conversion Score (0-100) ---
  // Direct conversion rate performance
  const conversionScore = Math.min(100, convRate * 15);

  // --- Overall Score ---
  const overallScore = Math.round(
    engagementScore * 0.25 +
      reliabilityScore * 0.30 +
      qualityScore * 0.25 +
      conversionScore * 0.20
  );

  const tier = calculateTier(overallScore);
  const totalDataPoints = totalClicks + profile.totalJobsCompleted + profile.totalReviews;

  return {
    overallScore,
    engagementScore: Math.round(engagementScore),
    reliabilityScore: Math.round(reliabilityScore),
    conversionScore: Math.round(conversionScore),
    qualityScore: Math.round(qualityScore),
    tier,
    totalDataPoints,
  };
}

// GET - Get score for current creator or specific creator
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");

    // If no creatorId, get current user's score
    let profileId = creatorId;
    if (!profileId) {
      const profile = await db.creatorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
      }
      profileId = profile.id;
    }

    // Try to get existing score
    let score = await db.creatorScore.findUnique({
      where: { creatorId: profileId },
    });

    // If no score or stale (older than 24h), recompute
    const isStale =
      !score ||
      Date.now() - new Date(score.lastCalculatedAt).getTime() > 24 * 60 * 60 * 1000;

    if (isStale) {
      const computed = await computeScore(profileId);
      if (!computed) {
        return NextResponse.json({ error: "Could not compute score" }, { status: 404 });
      }

      score = await db.creatorScore.upsert({
        where: { creatorId: profileId },
        create: {
          creatorId: profileId,
          ...computed,
          lastCalculatedAt: new Date(),
        },
        update: {
          ...computed,
          lastCalculatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ score });
  } catch (error: any) {
    console.error("Creator score error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Force recalculate score
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const computed = await computeScore(profile.id);
    if (!computed) {
      return NextResponse.json({ error: "Could not compute score" }, { status: 500 });
    }

    const score = await db.creatorScore.upsert({
      where: { creatorId: profile.id },
      create: {
        creatorId: profile.id,
        ...computed,
        lastCalculatedAt: new Date(),
      },
      update: {
        ...computed,
        lastCalculatedAt: new Date(),
      },
    });

    return NextResponse.json({ score, recalculated: true });
  } catch (error: any) {
    console.error("Creator score recalc error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
