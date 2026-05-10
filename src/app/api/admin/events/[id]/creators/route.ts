import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeEventTotals } from "@/lib/events/recompute-totals";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

// POST — attach a creator to an event with signup attribution + payout.
// Body: { creatorId, signupsGenerated, payoutKobo }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: eventId } = await params;

  try {
    const body = await req.json();
    const { creatorId, signupsGenerated, payoutKobo } = body as {
      creatorId: string;
      signupsGenerated: number;
      payoutKobo: number;
    };

    if (
      !creatorId ||
      typeof signupsGenerated !== "number" ||
      signupsGenerated < 0 ||
      typeof payoutKobo !== "number" ||
      payoutKobo < 0
    ) {
      return NextResponse.json(
        { error: "creatorId, signupsGenerated (≥0), payoutKobo (≥0) required" },
        { status: 400 }
      );
    }

    const eventCreator = await db.eventCreator.upsert({
      where: { eventId_creatorId: { eventId, creatorId } },
      create: { eventId, creatorId, signupsGenerated, payoutKobo },
      update: { signupsGenerated, payoutKobo },
    });

    await recomputeEventTotals(eventId);

    return NextResponse.json({ eventCreator }, { status: 201 });
  } catch (error: any) {
    console.error("Attach event creator error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to attach creator" },
      { status: 500 }
    );
  }
}
