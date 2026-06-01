import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

// GET — list Gravy Army members, or search non-members when ?search= is provided
export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();

  if (search) {
    const candidates = await db.creatorProfile.findMany({
      where: {
        isGravyArmy: false,
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        tier: true,
        totalJobsCompleted: true,
        avgRating: true,
        user: { select: { email: true } },
      },
      take: 20,
      orderBy: { avgRating: "desc" },
    });
    return NextResponse.json({ candidates });
  }

  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      tier: true,
      tierUpdatedAt: true,
      gravyOnboardedAt: true,
      totalJobsCompleted: true,
      totalEarningsKobo: true,
      avgRating: true,
      user: { select: { email: true } },
    },
    orderBy: [{ tier: "desc" }, { gravyOnboardedAt: "desc" }],
  });

  return NextResponse.json({ army });
}

// POST — toggle Gravy Army membership for a creator
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { creatorId, isGravyArmy } = body as {
      creatorId: string;
      isGravyArmy: boolean;
    };

    if (!creatorId || typeof isGravyArmy !== "boolean") {
      return NextResponse.json(
        { error: "creatorId and isGravyArmy required" },
        { status: 400 }
      );
    }

    const updated = await db.creatorProfile.update({
      where: { id: creatorId },
      data: {
        isGravyArmy,
        gravyOnboardedAt: isGravyArmy ? new Date() : null,
      },
      select: {
        id: true,
        displayName: true,
        isGravyArmy: true,
        gravyOnboardedAt: true,
      },
    });

    return NextResponse.json({ creator: updated });
  } catch (error: any) {
    console.error("Toggle Gravy Army error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update Gravy Army membership" },
      { status: 500 }
    );
  }
}
