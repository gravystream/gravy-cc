import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await db.eventActivation.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendingCreators: true } },
    },
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, location, date, description, budgetKobo } = body as {
      name: string;
      location: string;
      date: string;
      description?: string;
      budgetKobo: number;
    };

    if (
      !name?.trim() ||
      !location?.trim() ||
      !date ||
      typeof budgetKobo !== "number" ||
      budgetKobo < 0
    ) {
      return NextResponse.json(
        { error: "name, location, date, and non-negative budgetKobo required" },
        { status: 400 }
      );
    }

    const event = await db.eventActivation.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        date: new Date(date),
        description: description?.trim() || null,
        budgetKobo,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create event" },
      { status: 500 }
    );
  }
}
