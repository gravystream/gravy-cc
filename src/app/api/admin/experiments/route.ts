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

  const experiments = await db.experiment.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ experiments });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, hypothesis, metric, sampleSize } = body as {
      name: string;
      hypothesis: string;
      metric: string;
      sampleSize?: number;
    };

    if (!name?.trim() || !hypothesis?.trim() || !metric?.trim()) {
      return NextResponse.json(
        { error: "name, hypothesis, and metric required" },
        { status: 400 }
      );
    }

    const experiment = await db.experiment.create({
      data: {
        name: name.trim(),
        hypothesis: hypothesis.trim(),
        metric: metric.trim(),
        sampleSize: typeof sampleSize === "number" && sampleSize > 0 ? sampleSize : 0,
      },
    });

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error: any) {
    console.error("Create experiment error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create experiment" },
      { status: 500 }
    );
  }
}
