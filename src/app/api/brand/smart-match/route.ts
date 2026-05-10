import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface MatchResult {
  creatorId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  niches: string[];
  platforms: string[];
  matchScore: number;
  matchReasons: string[];
  tier: string;
  overallScore: number;
  avgRating: number;
  totalJobsCompleted: number;
  baseRateKobo: number;
}

function computeNicheOverlap(creatorNiches: string[], campaignNiches: string[]): number {
  if (campaignNiches.length === 0) return 0.5; // neutral if campaign has no niche filter
  const lower1 = creatorNiches.map((n) => n.toLowerCase());
  const lower2 = campaignNiches.map((n) => n.toLowerCase());
  const matches = lower1.filter((n) => lower2.includes(n)).length;
  return campaignNiches.length > 0 ? matches / campaignNiches.length : 0;
}

function computePlatformOverlap(creatorPlatforms: string[], targetPlatforms: string[]): number {
  if (targetPlatforms.length === 0) return 0.5;
  const lower1 = creatorPlatforms.map((p) => p.toLowerCase());
  const lower2 = targetPlatforms.map((p) => p.toLowerCase());
  const matches = lower1.filter((p) => lower2.includes(p)).length;
  return targetPlatforms.length > 0 ? matches / targetPlatforms.length : 0;
}

// GET - Smart match creators for a campaign or brand criteria
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const nichesParam = searchParams.get("niches");
    const platformsParam = searchParams.get("platforms");
    const maxBudget = searchParams.get("maxBudget");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get target criteria from campaign or params
    let targetNiches: string[] = [];
    let targetPlatforms: string[] = [];
    let budgetLimit = maxBudget ? parseInt(maxBudget) : 0;

    if (campaignId) {
      const campaign = await db.campaign.findFirst({
        where: { id: campaignId },
      });
      if (campaign) {
        targetNiches = (campaign as any).niches || [];
        targetPlatforms = (campaign as any).platforms || [];
        budgetLimit = budgetLimit || (campaign as any).budgetKobo || 0;
      }
    }

    if (nichesParam) targetNiches = nichesParam.split(",").map((n) => n.trim());
    if (platformsParam) targetPlatforms = platformsParam.split(",").map((p) => p.trim());

    // Get all available creators with their scores
    const creators = await db.creatorProfile.findMany({
      where: {
        availability: "AVAILABLE",
        isVerified: true,
        ...(budgetLimit > 0 ? { baseRateKobo: { lte: budgetLimit } } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
        creatorScore: true,
      },
      take: 100, // pre-filter pool
    });

    // Score and rank each creator
    const matches: MatchResult[] = creators
      .map((creator) => {
        const reasons: string[] = [];
        let score = 0;

        // 1. Niche match (0-35 points)
        const nicheOverlap = computeNicheOverlap(creator.niches, targetNiches);
        const nicheScore = nicheOverlap * 35;
        score += nicheScore;
        if (nicheOverlap >= 0.5) reasons.push("Strong niche alignment");

        // 2. Platform match (0-20 points)
        const platformOverlap = computePlatformOverlap(creator.platforms, targetPlatforms);
        const platformScore = platformOverlap * 20;
        score += platformScore;
        if (platformOverlap >= 0.5) reasons.push("Platform match");

        // 3. Performance score (0-25 points)
        const perfScore = creator.creatorScore
          ? (creator.creatorScore.overallScore / 100) * 25
          : 5; // default minimum
        score += perfScore;
        if (creator.creatorScore && creator.creatorScore.overallScore >= 70) {
          reasons.push("High performance score");
        }

        // 4. Quality / rating (0-10 points)
        const qualScore = (creator.avgRating / 5) * 10;
        score += qualScore;
        if (creator.avgRating >= 4.5) reasons.push("Top rated");

        // 5. Reliability bonus (0-10 points)
        const reliabilityScore = Math.min(10, (creator.totalJobsCompleted / 10) * 10);
        score += reliabilityScore;
        if (creator.totalJobsCompleted >= 10) reasons.push("Experienced creator");

        if (reasons.length === 0) reasons.push("Available creator");

        return {
          creatorId: creator.id,
          userId: creator.userId,
          displayName: creator.displayName,
          username: creator.username,
          avatarUrl: creator.avatarUrl,
          niches: creator.niches,
          platforms: creator.platforms,
          matchScore: Math.round(score),
          matchReasons: reasons,
          tier: creator.creatorScore?.tier || "bronze",
          overallScore: creator.creatorScore?.overallScore || 0,
          avgRating: creator.avgRating,
          totalJobsCompleted: creator.totalJobsCompleted,
          baseRateKobo: creator.baseRateKobo,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return NextResponse.json({
      matches,
      criteria: { niches: targetNiches, platforms: targetPlatforms, budgetLimit },
      total: matches.length,
    });
  } catch (error: any) {
    console.error("Smart match error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
