import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWeeklyReport } from "@/lib/reports/weekly-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

function isAdmin(session: any) {
  return session?.user && ADMIN_ROLES.includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await db.weeklyReport.findMany({
    orderBy: { weekStart: "desc" },
    take: 26, // last ~6 months
    select: {
      id: true,
      weekStart: true,
      headline: true,
      generatedBy: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reports });
}

// POST — manually trigger generation for the most recent completed week
export async function POST() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const report = await generateWeeklyReport();
    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error("Manual weekly report failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
