import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeEventTotals } from "@/lib/events/recompute-totals";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; ecId: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: eventId, ecId } = await params;

  try {
    await db.eventCreator.delete({ where: { id: ecId } });
    await recomputeEventTotals(eventId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to detach creator" },
      { status: 500 }
    );
  }
}
