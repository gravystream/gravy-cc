import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPortfolioQuality } from "@/lib/ai";
import { getConfigNumber } from "@/lib/platform-config";

// POST /api/admin/creators/[id]/ai-check  admin triggers AI scoring for a creator
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin role check
    if (!["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await db.creatorProfile.findUnique({
      where: { id: params.id },
      include: {
        portfolioVideos: true,
        user: { select: { name: true, email: true } },
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

    const updatedProfile = await db.creatorProfile.update({
      where: { id: profile.id },
      data: {
        portfolioAiScore: result.overallScore,
        portfolioAiFeedback: result.feedback,
        portfolioAiCheckedAt: new Date(),
        ...(result.qualified ? { isVerified: true } : {}),
      },
    });

    return NextResponse.json({
      creatorId: profile.id,
      creatorName: profile.user.name,
      score: result.overallScore,
      contentQuality: result.contentQuality,
      nicheRelevance: result.nicheRelevance,
      profileCompleteness: result.profileCompleteness,
      feedback: result.feedback,
      qualified: result.qualified,
      isVerified: updatedProfile.isVerified,
    });
  } catch (error: any) {
    console.error("Admin AI check error:", error);
    return NextResponse.json(
      { error: "AI scoring failed", details: error.message },
      { status: 500 }
    );
  }
}
