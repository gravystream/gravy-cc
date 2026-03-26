import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPortfolioQuality } from "@/lib/ai";
import { getConfigNumber } from "@/lib/platform-config";

// POST /api/portfolio/ai-check  trigger AI scoring on current creator's portfolio
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        portfolioVideos: true,
        user: { select: { name: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    if (profile.portfolioVideos.length === 0) {
      return NextResponse.json({ error: "No portfolio videos to evaluate" }, { status: 400 });
    }

    const threshold = await getConfigNumber("ai_quality_threshold");

    const result = await checkPortfolioQuality({
      portfolioVideos: profile.portfolioVideos.map((v) => ({
        title: v.title,
        description: v.description || undefined,
        niche: v.niche || undefined,
        platform: v.platform || undefined,
        cloudinaryUrl: v.cloudinaryUrl,
      })),
      creatorNiches: profile.niches,
      creatorBio: profile.bio || undefined,
    }, threshold);

    // Update the creator profile with AI scoring results
    const updatedProfile = await db.creatorProfile.update({
      where: { id: profile.id },
      data: {
        portfolioAiScore: result.overallScore,
        portfolioAiFeedback: result.feedback,
        portfolioAiCheckedAt: new Date(),
        // Auto-approve or keep pending based on score
        ...(result.qualified ? { isVerified: true } : {}),
      },
    });

    return NextResponse.json({
      score: result.overallScore,
      contentQuality: result.contentQuality,
      nicheRelevance: result.nicheRelevance,
      profileCompleteness: result.profileCompleteness,
      feedback: result.feedback,
      qualified: result.qualified,
      isVerified: updatedProfile.isVerified,
    });
  } catch (error: any) {
    console.error("Portfolio AI check error:", error);
    return NextResponse.json(
      { error: "AI scoring failed", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/portfolio/ai-check  get current AI score for creator
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        portfolioAiScore: true,
        portfolioAiFeedback: true,
        portfolioAiCheckedAt: true,
        isVerified: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      score: profile.portfolioAiScore,
      feedback: profile.portfolioAiFeedback,
      checkedAt: profile.portfolioAiCheckedAt,
      isVerified: profile.isVerified,
    });
  } catch (error: any) {
    console.error("Portfolio AI check GET error:", error);
    return NextResponse.json({ error: "Failed to get AI score" }, { status: 500 });
  }
}
