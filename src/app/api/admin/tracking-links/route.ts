import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Allowed admin roles
const ADMIN_ROLES = ["OWNER", "ADMINISTRATOR", "TECHNICAL", "SUPPORT"];

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all tracking links with relations
    const links = await db.trackingLink.findMany({
      include: {
        campaign: {
          include: {
            brand: {
              select: {
                id: true,
                companyName: true,
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        conversions: {
          select: { id: true, value: true },
        },
        clicks: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      links: links.map((link) => ({
        ...link,
        totalClicks: link.clicks.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching tracking links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
