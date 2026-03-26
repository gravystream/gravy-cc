import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brand = await db.brandProfile.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    // Campaign counts by status
    const campaigns = await db.campaign.findMany({
      where: { brandId: brand.id },
      include: {
        escrow: true,
        proposals: { select: { id: true, status: true, createdAt: true, creatorId: true } },
      },
    });

    const statusCounts: Record<string, number> = {};
    campaigns.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    // Jobs for this brand's campaigns
    const campaignIds = campaigns.map((c) => c.id);
    const jobs = await db.job.findMany({
      where: { campaignId: { in: campaignIds } },
      include: {
        review: true,
        creator: { include: { user: { select: { name: true, image: true } } } },
        deliverables: { where: { isLatest: true }, orderBy: { createdAt: "desc" } },
      },
    });

    // Escrow aggregation
    const escrows = campaigns.map((c) => c.escrow).filter(Boolean);
    const totalEscrowed = escrows.reduce((sum, e) => sum + (e?.amountKobo || 0), 0);
    const totalReleased = escrows.filter((e) => e?.status === "RELEASED").reduce((sum, e) => sum + (e?.amountKobo || 0), 0);
    const totalRefunded = escrows.filter((e) => e?.status === "REFUNDED").reduce((sum, e) => sum + (e?.amountKobo || 0), 0);

    // Monthly spend (released escrows)
    const monthlySpend: Record<string, number> = {};
    escrows.forEach((e) => {
      if (e && (e.status === "RELEASED" || e.status === "FUNDED" || e.status === "HELD")) {
        const month = e.createdAt.toISOString().slice(0, 7);
        monthlySpend[month] = (monthlySpend[month] || 0) + e.amountKobo;
      }
    });
    const spendHistory = Object.entries(monthlySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    // Reviews / ratings
    const reviews = jobs.filter((j) => j.review).map((j) => j.review!);
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length : 0;

    // Top creators
    const creatorRatings: Record<string, { name: string; image: string | null; totalRating: number; count: number }> = {};
    jobs.forEach((j) => {
      if (j.review) {
        const cid = j.creatorId;
        if (!creatorRatings[cid]) {
          creatorRatings[cid] = { name: j.creator.user.name || "Unknown", image: j.creator.user.image || null, totalRating: 0, count: 0 };
        }
        creatorRatings[cid].totalRating += j.review.overallRating;
        creatorRatings[cid].count += 1;
      }
    });
    const topCreators = Object.entries(creatorRatings)
      .map(([id, data]) => ({ id, name: data.name, image: data.image, avgRating: data.totalRating / data.count, jobCount: data.count }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // Unique creators hired
    const uniqueCreators = new Set(jobs.map((j) => j.creatorId)).size;

    // Completion rate
    const completedCampaigns = campaigns.filter((c) => c.status === "COMPLETED").length;
    const nonDraftCampaigns = campaigns.filter((c) => c.status !== "DRAFT").length;
    const completionRate = nonDraftCampaigns > 0 ? (completedCampaigns / nonDraftCampaigns) * 100 : 0;

    // Average time to completion (campaigns that have jobs with approved deliverables)
    let avgCompletionDays = 0;
    const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
    if (completedJobs.length > 0) {
      const totalDays = completedJobs.reduce((sum, j) => {
        const diff = (j.updatedAt.getTime() - j.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgCompletionDays = totalDays / completedJobs.length;
    }

    // Recent proposals
    const recentProposals = await db.proposal.findMany({
      where: { campaign: { brandId: brand.id } },
      include: {
        campaign: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Recent deliverables
    const recentDeliverables = await db.jobDeliverable.findMany({
      where: { job: { campaignId: { in: campaignIds } }, isLatest: true },
      include: {
        job: { include: { creator: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Recent campaign updates
    const recentCampaigns = campaigns
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map((c) => ({ id: c.id, title: c.title, status: c.status, updatedAt: c.updatedAt }));

    // Spend breakdown by campaign
    const spendByCampaign = campaigns
      .filter((c) => c.escrow)
      .map((c) => ({ id: c.id, title: c.title, amount: c.escrow!.amountKobo, status: c.escrow!.status }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      overview: {
        totalCampaigns: campaigns.length,
        statusCounts,
        totalSpend: totalReleased,
        completionRate: Math.round(completionRate),
        avgCompletionDays: Math.round(avgCompletionDays * 10) / 10,
      },
      ratings: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        topCreators,
        uniqueCreators,
      },
      spend: {
        totalEscrowed,
        totalReleased,
        totalRefunded,
        history: spendHistory,
        byCampaign: spendByCampaign,
      },
      activity: {
        recentCampaigns,
        recentProposals: recentProposals.map((p) => ({
          id: p.id,
          campaignTitle: p.campaign.title,
          status: p.status,
          createdAt: p.createdAt,
        })),
        recentDeliverables: recentDeliverables.map((d) => ({
          id: d.id,
          creatorName: d.job.creator.user.name,
          createdAt: d.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
