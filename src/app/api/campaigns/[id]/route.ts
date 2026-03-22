import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await db.campaign.findUnique({
      where: { id: id },
      include: {
        brand: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        proposals: { select: { id: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[GET /api/campaigns/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const campaign = await db.campaign.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[PATCH /api/campaigns/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await db.campaign.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/campaigns/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
