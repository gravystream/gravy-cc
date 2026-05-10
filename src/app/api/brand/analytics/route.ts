import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const brandProfile = await db.brandProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }
    const brandId = brandProfile.id;

    // Get all campaigns with related data
    const campaigns = await db.campaign.findMany({
      where: { brandId },
      include: {
        escrow: true,
        proposals: { select: { id: true, status: true, createdAt: true } },
        contracts: { select: { id: true, status: true, createdAt: true } },
        trackingLinks: {
          include: { conversions: true, clicks: true }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get reviews through Job -> Campaign path
    const reviews = await db.review.findMany({
      where: {
        job: {
          campaignId: { in: campaigns.map(c => c.id) }
        }
      },
      include: {
        job: { select: { creatorId: true, campaignId: true } }
      }
    });

    // Overview
    const statusCounts: Record<string, number> = {};
    campaigns.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED");
    const completionRate = campaigns.length > 0
      ? Math.round((completedCampaigns.length / campaigns.length) * 100)
      : 0;
    const avgCompletionDays = completedCampaigns.length > 0
      ? Math.round(completedCampaigns.reduce((sum, c) => {
          const days = (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedCampaigns.length)
      : 0;

    const totalSpend = campaigns.reduce((sum, c) => {
      if (c.escrow && (c.escrow.status === "RELEASED" || c.escrow.status === "COMPLETED")) {
        return sum + c.escrow.amountKobo;
      }
      return sum;
    }, 0);

    // Spend
    const now = new Date();
    const history = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthCampaigns = campaigns.filter(c => {
        if (!c.escrow || (c.escrow.status !== "RELEASED" && c.escrow.status !== "COMPLETED")) return false;
        const updated = new Date(c.updatedAt);
        return updated.getMonth() === d.getMonth() && updated.getFullYear() === d.getFullYear();
      });
      return {
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        amount: monthCampaigns.reduce((s, c) => s + (c.escrow?.amountKobo || 0), 0),
      };
    });

    const totalEscrowed = campaigns.reduce((s, c) => s + (c.escrow?.amountKobo || 0), 0);
    const totalReleased = campaigns.reduce((s, c) => {
      if (c.escrow?.status === "RELEASED" || c.escrow?.status === "COMPLETED") return s + (c.escrow.amountKobo || 0);
      return s;
    }, 0);
    const totalRefunded = campaigns.reduce((s, c) => {
      if (c.escrow?.status === "REFUNDED") return s + (c.escrow.amountKobo || 0);
      return s;
    }, 0);

    const byCampaign = campaigns.slice(0, 10).map(c => ({
      id: c.id,
      title: c.title,
      amount: c.budgetKobo,
      escrowed: c.escrow?.amountKobo || 0,
      status: c.escrow?.status || "NONE",
    }));

    // Ratings from reviews
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length) * 10) / 10
      : 0;
    const uniqueCreators = new Set(reviews.map(r => r.job?.creatorId).filter(Boolean)).size;
    const creatorRatings: Record<string, { total: number; count: number; id: string }> = {};
    reviews.forEach(r => {
      const cid = r.job?.creatorId;
      if (!cid) return;
      if (!creatorRatings[cid]) creatorRatings[cid] = { total: 0, count: 0, id: cid };
      creatorRatings[cid].total += r.overallRating;
      creatorRatings[cid].count += 1;
    });
    const topCreators = Object.values(creatorRatings)
      .map(c => ({ creatorId: c.id, avgRating: Math.round((c.total / c.count) * 10) / 10, reviewCount: c.count }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // Activity
    const recentCampaigns = campaigns.slice(0, 5).map(c => ({
      id: c.id, title: c.title, status: c.status, createdAt: c.createdAt, updatedAt: c.updatedAt,
    }));
    const allProposals = campaigns.flatMap(c => c.proposals.map(p => ({ ...p, campaignTitle: c.title })));
    allProposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentProposals = allProposals.slice(0, 5);
    const allContracts = campaigns.flatMap(c => c.contracts.map(ct => ({ ...ct, campaignTitle: c.title })));
    allContracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentDeliverables = allContracts.slice(0, 5);

    return NextResponse.json({
      overview: {
        totalCampaigns: campaigns.length,
        statusCounts,
        totalSpend,
        completionRate,
        avgCompletionDays,
      },
      spend: { history, totalEscrowed, totalReleased, totalRefunded, byCampaign },
      ratings: { avgRating, totalReviews: reviews.length, uniqueCreators, topCreators },
      activity: { recentCampaigns, recentProposals, recentDeliverables },
    });
  } catch (error) {
    console.error("Brand analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}