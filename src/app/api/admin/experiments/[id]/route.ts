import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];
const VALID_STATUSES = ["DRAFT", "RUNNING", "COMPLETED", "ABANDONED"] as const;

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

  const experiment = await db.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json(
      { error: "Experiment not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ experiment });
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
    if (typeof body.hypothesis === "string")
      data.hypothesis = body.hypothesis.trim();
    if (typeof body.metric === "string") data.metric = body.metric.trim();
    if (typeof body.sampleSize === "number" && body.sampleSize >= 0)
      data.sampleSize = body.sampleSize;

    if (typeof body.status === "string") {
      if (!VALID_STATUSES.includes(body.status as any)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      data.status = body.status;
      // Auto-stamp dates on transitions
      if (body.status === "RUNNING") data.startDate = new Date();
      if (body.status === "COMPLETED" || body.status === "ABANDONED")
        data.endDate = new Date();
    }

    if ("controlData" in body) data.controlData = body.controlData ?? null;
    if ("variantData" in body) data.variantData = body.variantData ?? null;
    if ("results" in body) data.results = body.results ?? null;

    const experiment = await db.experiment.update({
      where: { id },
      data,
    });
    return NextResponse.json({ experiment });
  } catch (error: any) {
    console.error("Update experiment error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update experiment" },
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
    await db.experiment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete" },
      { status: 500 }
    );
  }
}
