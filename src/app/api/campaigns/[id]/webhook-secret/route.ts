// Webhook Secret Management
// POST /api/campaigns/[id]/webhook-secret — generate new webhook secret
// GET /api/campaigns/[id]/webhook-secret — get existing secret (masked)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const campaign = await db.campaign.findFirst({
      where: { id: params.id, brandId: brandProfile.id },
      select: { id: true, webhookSecret: true, title: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Return masked secret
    const masked = campaign.webhookSecret
      ? campaign.webhookSecret.slice(0, 8) + "..." + campaign.webhookSecret.slice(-4)
      : null;

    return NextResponse.json({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      webhookSecret: masked,
      hasSecret: !!campaign.webhookSecret,
      webhookUrl: "https://novaclio.io/api/webhooks/conversions",
    });
  } catch (error: any) {
    console.error("Webhook secret GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const campaign = await db.campaign.findFirst({
      where: { id: params.id, brandId: brandProfile.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Generate a new webhook secret
    const newSecret = "whsec_" + randomBytes(32).toString("hex");

    await db.campaign.update({
      where: { id: campaign.id },
      data: { webhookSecret: newSecret },
    });

    return NextResponse.json({
      ok: true,
      webhookSecret: newSecret,
      webhookUrl: "https://novaclio.io/api/webhooks/conversions",
      message: "Save this secret securely. It won't be shown in full again.",
    });
  } catch (error: any) {
    console.error("Webhook secret POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
