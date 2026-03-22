import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/profile/creator — get current creator's profile
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.creatorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      portfolioVideos: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ profile });
}

// POST /api/profile/creator — create creator profile (called after signup)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "CREATOR") {
    return NextResponse.json({ error: "Only creators can create a creator profile" }, { status: 403 });
  }

  // Check if profile already exists
  const existing = await db.creatorProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists, use PUT to update" }, { status: 400 });
  }

  const {
    username, displayName, bio, tagline, location,
    niches, platforms, baseRateKobo, currency,
    tiktokHandle, instagramHandle, youtubeHandle, twitterHandle,
    avatarUrl, coverUrl,
  } = await req.json();

  if (!username || !displayName) {
    return NextResponse.json({ error: "username and displayName are required" }, { status: 400 });
  }

  // Check username uniqueness
  const usernameConflict = await db.creatorProfile.findUnique({ where: { username } });
  if (usernameConflict) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const profile = await db.creatorProfile.create({
    data: {
      userId: user.id,
      username,
      displayName,
      bio: bio ?? "",
      tagline: tagline ?? "",
      location: location ?? "",
      niches: niches ?? [],
      platforms: platforms ?? [],
      baseRateKobo: baseRateKobo ?? 0,
      currency: currency ?? "NGN",
      tiktokUrl: tiktokHandle ?? null,
      instagramUrl: instagramHandle ?? null,
      youtubeUrl: youtubeHandle ?? null,
      twitterUrl: twitterHandle ?? null,
      avatarUrl: avatarUrl ?? null,
      coverUrl: coverUrl ?? null,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

// PUT /api/profile/creator — update existing creator profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updates = await req.json();

  // If username is being changed, check uniqueness
  if (updates.username && updates.username !== profile.username) {
    const conflict = await db.creatorProfile.findUnique({ where: { username: updates.username } });
    if (conflict) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  const updatedProfile = await db.creatorProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(updates.username && { username: updates.username }),
      ...(updates.displayName && { displayName: updates.displayName }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.tagline !== undefined && { tagline: updates.tagline }),
      ...(updates.location !== undefined && { location: updates.location }),
      ...(updates.niches && { niches: updates.niches }),
      ...(updates.platforms && { platforms: updates.platforms }),
      ...(updates.baseRateKobo !== undefined && { baseRateKobo: updates.baseRateKobo }),
      ...(updates.availability && { availability: updates.availability }),
      ...(updates.tiktokHandle !== undefined && { tiktokUrl: updates.tiktokHandle }),
      ...(updates.instagramHandle !== undefined && { instagramUrl: updates.instagramHandle }),
      ...(updates.youtubeHandle !== undefined && { youtubeUrl: updates.youtubeHandle }),
      ...(updates.twitterHandle !== undefined && { twitterUrl: updates.twitterHandle }),
      ...(updates.avatarUrl && { avatarUrl: updates.avatarUrl }),
      ...(updates.coverUrl && { coverUrl: updates.coverUrl }),
    },
  });

  return NextResponse.json({ profile: updatedProfile });
}
