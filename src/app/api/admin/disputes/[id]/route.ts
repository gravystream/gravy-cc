import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            campaign: {
              include: {
                brand: { include: { user: { select: { name: true, email: true } } } },
                escrow: true,
              },
            },
            creator: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Admin dispute detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, resolution } = body;

  const validStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED_FOR_BRAND", "RESOLVED_FOR_CREATOR", "CLOSED"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolvedById = (session.user as any).id;
      updateData.resolvedAt = new Date();
    }

    const dispute = await db.dispute.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Admin dispute update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
