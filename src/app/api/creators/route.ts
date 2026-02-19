import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/creators — public creator discovery endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const niche = searchParams.get("niche");
  const platform = searchParams.get("platform");
  const location = searchParams.get("location");
  const availability = searchParams.get("availability") as "AVAILABLE" | "BUSY" | null;
  const minScore = parseFloat(searchParams.get("minScore") || "0");
  const sortBy = searchParams.get("sortBy") || "avgRating";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const creators = await db.creatorProfile.findMany({
    where: {
      ...(niche && { niches: { has: niche } }),
      ...(platform && { platforms: { has: platform } }),
      ...(location && { location: { contains: location, mode: "insensitive" } }),
      ...(availability && { availability }),
      ...(minScore > 0 && { avgRating: { gte: minScore } }),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      tagline: true,
      location: true,
      niches: true,
      platforms: true,
      baseRateKobo: true,
      currency: true,
      availability: true,
      isVerified: true,
      totalJobsCompleted: true,
      avgRating: true,
      totalReviews: true,
      portfolioVideos: {
        where: { isFeatured: true },
        take: 1,
        select: { thumbnailUrl: true, cloudinaryUrl: true, durationSeconds: true },
      },
    },
    orderBy: sortBy === "avgRating"
      ? { avgRating: "desc" }
      : sortBy === "totalJobs"
      ? { totalJobsCompleted: "desc" }
      : sortBy === "rate_asc"
      ? { baseRateKobo: "asc" }
      : { avgRating: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  const nextCursor = creators.length === limit ? creators[creators.length - 1].id : null;

  return NextResponse.json({ creators, nextCursor });
}
