import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      totalUsers,
      totalCreators,
      totalBrands,
      activeCampaigns,
      openDisputes,
      releasedEscrows,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "CREATOR" } }),
      db.user.count({ where: { role: "BRAND" } }),
      db.campaign.count({ where: { status: "ACTIVE" } }),
      db.dispute.count({ where: { status: "OPEN" } }),
      db.escrow.aggregate({
        where: { status: "RELEASED" },
        _sum: { amountKobo: true },
      }),
    ]);

    const totalRevenueKobo = releasedEscrows._sum.amountKobo || 0;

    return NextResponse.json({
      totalUsers,
      totalCreators,
      totalBrands,
      activeCampaigns,
      openDisputes,
      totalRevenueKobo,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
