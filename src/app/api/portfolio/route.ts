import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPortfolioQuality } from "@/lib/ai";
import { getConfigNumber } from "@/lib/platform-config";

// POST /api/portfolio — add a portfolio video to creator profile
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const {
    cloudinaryId, cloudinaryUrl, thumbnailUrl,
    title, description, niche, platform,
    durationSeconds, isFeatured,
  } = await req.json();

  if (!cloudinaryUrl) {
    return NextResponse.json({ error: "cloudinaryUrl is required" }, { status: 400 });
  }

  const video = await db.portfolioVideo.create({
    data: {
      creatorId: profile.id,
      cloudinaryId: cloudinaryId ?? cloudinaryUrl,
      cloudinaryUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      title: title ?? "",
      description: description ?? "",
      niche: niche ?? profile.niches[0] ?? "",
      platform: platform ?? profile.platforms[0] ?? "",
      durationSeconds: durationSeconds ?? 0,
      isFeatured: isFeatured ?? false,
    },
  });

  return NextResponse.json({ video }, { status: 201 });
}

// GET /api/portfolio — get current creator's portfolio videos
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ videos: [] });
  }

  const videos = await db.portfolioVideo.findMany({
    where: { creatorId: profile.id },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ videos });
}

// DELETE /api/portfolio?videoId=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  const video = await db.portfolioVideo.findUnique({ where: { id: videoId } });

  if (!video || !profile || video.creatorId === profile.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  await db.portfolioVideo.delete({ where: { id: videoId } });

  return NextResponse.json({ success: true });
}


// Async helper to run AI portfolio scoring after video upload
async function triggerPortfolioAiCheck(profileId: string, userId: string) {
  try {
    const profile = await db.creatorProfile.findUnique({
      where: { id: profileId },
      include: { portfolioVideos: true },
    });
    if (!profile || profile.portfolioVideos.length === 0) return;

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

    await db.creatorProfile.update({
      where: { id: profileId },
      data: {
        portfolioAiScore: result.overallScore,
        portfolioAiFeedback: result.feedback,
        portfolioAiCheckedAt: new Date(),
        ...(result.qualified ? { isVerified: true } : {}),
      },
    });

    console.log(`Portfolio AI check for ${profileId}: score=${result.overallScore}, qualified=${result.qualified}`);
  } catch (err) {
    console.error("triggerPortfolioAiCheck error:", err);
  }
}
