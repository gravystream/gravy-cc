import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["DRAFT", "ACTIVE", "REVIEWING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

async function loadCampaignWithOwnership(campaignId: string, userId: string) {
  const brandProfile = await db.brandProfile.findUnique({ where: { userId } });
  if (!brandProfile) return { error: "Brand profile not found", status: 404 as const };
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found", status: 404 as const };
  if (campaign.brandId !== brandProfile.id) return { error: "Forbidden", status: 403 as const };
  return { brandProfile, campaign };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;
    const result = await loadCampaignWithOwnership(id, session.user.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ campaign: result.campaign });
  } catch (e: any) {
    console.error("Brand campaign GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;
    const result = await loadCampaignWithOwnership(id, session.user.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim().length > 0) data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.requirements === "string") data.requirements = body.requirements;
    if (Array.isArray(body.niches)) data.niches = body.niches.filter((n: unknown) => typeof n === "string");
    if (Array.isArray(body.platforms)) data.platforms = body.platforms.filter((p: unknown) => typeof p === "string");
    if (body.deadline) {
      const dt = new Date(body.deadline);
      if (!isNaN(dt.getTime())) data.deadline = dt;
    }
    if (typeof body.budgetKobo === "number" && body.budgetKobo >= 0) {
      data.budgetKobo = Math.round(body.budgetKobo);
    } else if (typeof body.budget === "number" && body.budget >= 0) {
      data.budgetKobo = Math.round(body.budget * 100);
    }
    if (typeof body.status === "string") {
      const upper = body.status.toUpperCase();
      if ((ALLOWED_STATUSES as readonly string[]).includes(upper)) {
        data.status = upper as AllowedStatus;
      } else {
        return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await db.campaign.update({ where: { id }, data });
    return NextResponse.json({ campaign: updated });
  } catch (e: any) {
    console.error("Brand campaign PATCH error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
