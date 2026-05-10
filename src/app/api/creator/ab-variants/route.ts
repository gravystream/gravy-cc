import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - List variants for a tracking link
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "linkId required" }, { status: 400 });
    }

    // Verify ownership
    const link = await db.trackingLink.findFirst({
      where: { id: linkId, creatorId: session.user.id },
    });
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const variants = await db.linkVariant.findMany({
      where: { trackingLinkId: linkId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ variants, parentLink: link });
  } catch (error: any) {
    console.error("AB variants GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new variant
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { linkId, label, destinationUrl, weight } = body;

    if (!linkId || !label || !destinationUrl) {
      return NextResponse.json(
        { error: "linkId, label, and destinationUrl are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const link = await db.trackingLink.findFirst({
      where: { id: linkId, creatorId: session.user.id },
    });
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Check max variants (limit to 5)
    const existingCount = await db.linkVariant.count({
      where: { trackingLinkId: linkId },
    });
    if (existingCount >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 variants per link" },
        { status: 400 }
      );
    }

    const variant = await db.linkVariant.create({
      data: {
        trackingLinkId: linkId,
        label,
        destinationUrl,
        weight: weight || 50,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error: any) {
    console.error("AB variants POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update variant weights or toggle active
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, weight, isActive, label, destinationUrl } = body;

    if (!variantId) {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }

    // Verify ownership through tracking link
    const variant = await db.linkVariant.findFirst({
      where: { id: variantId },
      include: { trackingLink: true },
    });
    if (!variant || variant.trackingLink.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (weight !== undefined) updateData.weight = weight;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (label) updateData.label = label;
    if (destinationUrl) updateData.destinationUrl = destinationUrl;

    const updated = await db.linkVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return NextResponse.json({ variant: updated });
  } catch (error: any) {
    console.error("AB variants PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a variant
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");

    if (!variantId) {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }

    const variant = await db.linkVariant.findFirst({
      where: { id: variantId },
      include: { trackingLink: true },
    });
    if (!variant || variant.trackingLink.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    await db.linkVariant.delete({ where: { id: variantId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("AB variants DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
