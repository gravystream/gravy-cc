import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const RESULTS_PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "creators"; // creators | campaigns
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const niches = searchParams.getAll("niche");
    const platforms = searchParams.getAll("platform");
    const location = searchParams.get("location");
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const verified = searchParams.get("verified");
    const availability = searchParams.get("availability");
    const sort = searchParams.get("sort") || "relevance";
    const skip = (page - 1) * RESULTS_PER_PAGE;

    if (type === "creators") {
      return await searchCreators({
        q, niches, platforms, location, minRating,
        verified: verified === "true" ? true : undefined,
        availability, sort, skip,
      });
    }

    if (type === "campaigns") {
      return await searchCampaigns({ q, niches, platforms, sort, skip });
    }

    return NextResponse.json({ error: "Invalid search type" }, { status: 400 });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function searchCreators(params: {
  q: string;
  niches: string[];
  platforms: string[];
  location: string | null;
  minRating: number;
  verified?: boolean;
  availability: string | null;
  sort: string;
  skip: number;
}) {
  const where: Prisma.CreatorProfileWhereInput = {};
  const conditions: Prisma.CreatorProfileWhereInput[] = [];

  // Full-text search using Prisma raw for tsquery
  if (params.q.trim()) {
    const sanitized = params.q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    if (sanitized) {
      // Use raw SQL for full-text search scoring
      const searchResults = await db.$queryRaw<Array<{ id: string; rank: number }>>`
        SELECT id, ts_rank(
          to_tsvector('english',
            coalesce("displayName", '') || ' ' ||
            coalesce("username", '') || ' ' ||
            coalesce("bio", '') || ' ' ||
            coalesce("tagline", '') || ' ' ||
            coalesce("location", '')
          ),
          plainto_tsquery('english', ${sanitized})
        ) as rank
        FROM "CreatorProfile"
        WHERE to_tsvector('english',
          coalesce("displayName", '') || ' ' ||
          coalesce("username", '') || ' ' ||
          coalesce("bio", '') || ' ' ||
          coalesce("tagline", '') || ' ' ||
          coalesce("location", '')
        ) @@ plainto_tsquery('english', ${sanitized})
        ORDER BY rank DESC
        LIMIT 200
      `;

      if (searchResults.length === 0) {
        return NextResponse.json({ results: [], total: 0, page: 1, totalPages: 0 });
      }

      conditions.push({ id: { in: searchResults.map((r) => r.id) } });
    }
  }

  if (params.niches.length > 0) {
    conditions.push({ niches: { hasSome: params.niches } });
  }
  if (params.platforms.length > 0) {
    conditions.push({ platforms: { hasSome: params.platforms } });
  }
  if (params.location) {
    conditions.push({ location: { contains: params.location, mode: "insensitive" } });
  }
  if (params.minRating > 0) {
    conditions.push({ avgRating: { gte: params.minRating } });
  }
  if (params.verified !== undefined) {
    conditions.push({ isVerified: params.verified });
  }
  if (params.availability) {
    conditions.push({ availability: params.availability as any });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const orderBy: Prisma.CreatorProfileOrderByWithRelationInput =
    params.sort === "rating" ? { avgRating: "desc" } :
    params.sort === "jobs" ? { totalJobsCompleted: "desc" } :
    params.sort === "newest" ? { createdAt: "desc" } :
    params.sort === "response" ? { responseTimeHours: "asc" } :
    { avgRating: "desc" }; // default: rating

  const [results, total] = await Promise.all([
    db.creatorProfile.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        portfolioVideos: { take: 3, orderBy: { createdAt: "desc" } },
        _count: { select: { proposals: true, jobs: true } },
      },
      orderBy,
      skip: params.skip,
      take: RESULTS_PER_PAGE,
    }),
    db.creatorProfile.count({ where }),
  ]);

  return NextResponse.json({
    results,
    total,
    page: Math.floor(params.skip / RESULTS_PER_PAGE) + 1,
    totalPages: Math.ceil(total / RESULTS_PER_PAGE),
  });
}

async function searchCampaigns(params: {
  q: string;
  niches: string[];
  platforms: string[];
  sort: string;
  skip: number;
}) {
  const where: Prisma.CampaignWhereInput = { status: "OPEN" };
  const conditions: Prisma.CampaignWhereInput[] = [];

  if (params.q.trim()) {
    const sanitized = params.q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    if (sanitized) {
      const searchResults = await db.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Campaign"
        WHERE to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
          @@ plainto_tsquery('english', ${sanitized})
        AND "status" = 'OPEN'
        LIMIT 200
      `;

      if (searchResults.length === 0) {
        return NextResponse.json({ results: [], total: 0, page: 1, totalPages: 0 });
      }
      conditions.push({ id: { in: searchResults.map((r) => r.id) } });
    }
  }

  if (params.niches.length > 0) {
    conditions.push({ niches: { hasSome: params.niches } });
  }
  if (params.platforms.length > 0) {
    conditions.push({ platforms: { hasSome: params.platforms } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [results, total] = await Promise.all([
    db.campaign.findMany({
      where,
      include: {
        brand: { include: { user: { select: { name: true, image: true } } } },
        _count: { select: { proposals: true, jobs: true } },
      },
      orderBy: params.sort === "newest" ? { createdAt: "desc" } : { createdAt: "desc" },
      skip: params.skip,
      take: RESULTS_PER_PAGE,
    }),
    db.campaign.count({ where }),
  ]);

  return NextResponse.json({
    results,
    total,
    page: Math.floor(params.skip / RESULTS_PER_PAGE) + 1,
    totalPages: Math.ceil(total / RESULTS_PER_PAGE),
  });
}
