import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeEventTotals } from "@/lib/events/recompute-totals";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const event = await db.eventActivation.findUnique({
    where: { id },
    include: {
      attendingCreators: {
        orderBy: { signupsGenerated: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              tier: true,
              isGravyArmy: true,
            },
          },
        },
      },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await req.json();
    const data: any = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.location === "string") data.location = body.location.trim();
    if (body.date) data.date = new Date(body.date);
    if ("description" in body)
      data.description = body.description ? String(body.description).trim() : null;
    if (typeof body.budgetKobo === "number" && body.budgetKobo >= 0)
      data.budgetKobo = body.budgetKobo;

    await db.eventActivation.update({ where: { id }, data });
    const event = await recomputeEventTotals(id);
    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await db.eventActivation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete event" },
      { status: 500 }
    );
  }
}
