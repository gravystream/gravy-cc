import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Allowed admin roles
const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

async function checkAdminAuth(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return null;
  }

  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const linkId = params.id;

    const link = await db.trackingLink.findUnique({
      where: { id: linkId },
      include: {
        campaign: {
          include: {
            brand: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        creator: {
          select: { id: true, name: true },
        },
        clicks: {
          orderBy: { timestamp: "desc" },
        },
        conversions: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    const breakdowns = {
      device: {} as Record<string, number>,
      browser: {} as Record<string, number>,
      country: {} as Record<string, number>,
      os: {} as Record<string, number>,
    };

    for (const click of link.clicks) {
      if (click.device) {
        breakdowns.device[click.device] = (breakdowns.device[click.device] || 0) + 1;
      }
      if (click.browser) {
        breakdowns.browser[click.browser] = (breakdowns.browser[click.browser] || 0) + 1;
      }
      if (click.country) {
        breakdowns.country[click.country] = (breakdowns.country[click.country] || 0) + 1;
      }
      if (click.os) {
        breakdowns.os[click.os] = (breakdowns.os[click.os] || 0) + 1;
      }
    }

    return NextResponse.json({
      ...link,
      breakdowns,
    });
  } catch (error) {
    console.error("Error fetching link details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const linkId = params.id;
    const body = await req.json();
    const { isActive, expiresAt, maxClicks } = body;

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxClicks !== undefined) updateData.maxClicks = maxClicks ? parseInt(maxClicks, 10) : null;

    const updatedLink = await db.trackingLink.update({
      where: { id: linkId },
      data: updateData,
      include: {
        campaign: {
          include: {
            brand: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        creator: {
          select: { id: true, name: true },
        },
        clicks: true,
        conversions: true,
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const linkId = params.id;

    await db.trackingLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
