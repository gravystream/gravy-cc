import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/creators/[id]  — fetch a single creator by id OR username
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const creator = await db.creatorProfile.findFirst({
      where: {
        OR: [{ id: id }, { username: id }],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        tagline: true,
        avatarUrl: true,
        coverUrl: true,
        location: true,
        languages: true,
        niches: true,
        platforms: true,
        baseRateKobo: true,
        currency: true,
        availability: true,
        isVerified: true,
        totalJobsCompleted: true,
        avgRating: true,
        totalReviews: true,
        responseTimeHours: true,
        tiktokUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        twitterUrl: true,
        createdAt: true,
        portfolioVideos: {
          orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
          select: {
            id: true,
            title: true,
            description: true,
            cloudinaryUrl: true,
            thumbnailUrl: true,
            durationSeconds: true,
            views: true,
            isFeatured: true,
          },
        },
        jobs: {
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            review: {
              select: {
                overallRating: true,
                qualityRating: true,
                communicationRating: true,
                comment: true,
                createdAt: true,
              },
            },
            proposal: {
              select: {
                campaign: {
                  select: {
                    title: true,
                    brand: {
                      select: {
                        companyName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    const transformedCreator = {
      ...creator,
      jobs: creator.jobs?.map((job: any) => ({
        ...job,
        campaign: job.proposal?.campaign ?? null,
        proposal: undefined,
      })),
    };
    return NextResponse.json({ creator: transformedCreator });
  } catch (error) {
    console.error("[GET /api/creators/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
