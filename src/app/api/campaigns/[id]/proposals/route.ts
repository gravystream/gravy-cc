import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkProposalWithAI } from "@/lib/ai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[DEBUG proposals GET] id:", id);
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [proposals, campaign] = await Promise.all([
      db.proposal.findMany({
        where: { campaignId: id },
        include: { creator: { include: { user: { select: { name: true, email: true, image: true } } } } },
        orderBy: { aiScore: "desc" },
      }),
      db.campaign.findUnique({
        where: { id: id },
        select: { title: true, budgetKobo: true },
      }),
    ]);
    const mappedProposals = proposals.map(({ creator, ...p }: any) => ({
      ...p,
      creatorProfile: creator ? {
        displayName: creator.displayName ?? creator.user?.name ?? null,
        bio: creator.bio ?? '',
        niche: creator.niches ?? [],
        followerCount: 0,
        avgEngagementRate: 0,
      } : null,
    }));
    return NextResponse.json({ proposals: mappedProposals, campaign });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[DEBUG proposals GET] id:", id);
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creator = await db.creatorProfile.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });

    const campaign = await db.campaign.findUnique({ where: { id: id } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = await req.json();

    // AI check
    let aiScore = null;
    let aiFeedback = null;
    try {
      const result = await checkProposalWithAI({
      coverLetter: body.pitch,
      campaignBrief: campaign.description,
      creatorNiches: creator.niches ?? [],
      deliverables: campaign.deliverables ?? [],
    });
      aiScore = result.score;
      aiFeedback = result.feedback;
    } catch (e) {
      console.error("AI check failed:", e);
    }

    const proposal = await db.proposal.create({
      data: {
        campaignId: id,
        creatorId: creator.id,
    coverLetter: body.pitch,
    proposedBudget: body.rate ? Number(body.rate) : undefined,
        aiScore,
        aiFeedback,
      },
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
