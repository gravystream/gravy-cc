import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkProposalWithAI } from "@/lib/ai";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposals= await db.proposal.findMany({
      where: { campaignId: params.id },
      include: { creator: { include: { user: { select: { name: true, email: true, image: true } } } } },
      orderBy: { aiScore: "desc" },
    });
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creator = await db.creator.findFirst({ where: { user: { email: session.user?.email! } } });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });

    const campaign = await db.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = await req.json();

    // AI check
    let aiScore = null;
    let aiFeedback = null;
    try {
      const result = await checkProposalWithAI({ pitch: body.pitch, campaign, creator });
      aiScore = result.score;
      aiFeedback = result.feedback;
    } catch (e) {
      console.error("AI check failed:", e);
    }

    const proposal = await db.proposal.create({
      data: {
        campaignId: params.id,
        creatorId: creator.id,
        pitch: body.pitch,
        rate: body.rate,
        aiScore,
        aiFeedback,
      },
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
