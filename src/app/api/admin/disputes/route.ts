import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = {};
    if (status && ["OPEN", "UNDER_REVIEW", "RESOLVED_FOR_BRAND", "RESOLVED_FOR_CREATOR", "CLOSED"].includes(status)) {
      where.status = status;
    }

    const [disputes, total] = await Promise.all([
      db.dispute.findMany({
        where,
        include: {
          job: {
            include: {
              campaign: {
                include: {
                  brand: { include: { user: { select: { name: true, email: true } } } },
                },
              },
              creator: { include: { user: { select: { name: true, email: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.dispute.count({ where }),
    ]);

    return NextResponse.json({ disputes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin disputes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
