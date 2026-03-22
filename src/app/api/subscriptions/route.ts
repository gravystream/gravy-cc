import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/subscriptions — get current user's subscription
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ subscription });
}

// POST /api/subscriptions/initialize — start a subscription via Paystack
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  // Get user with role
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if already subscribed
  const existingSub = await db.subscription.findUnique({ where: { userId: user.id } });
  if (existingSub?.status === "ACTIVE") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  // Plan amounts: N10,000/month for creators, N5,000/month for brands
  const amountKobo = user.role === "CREATOR" ? 1000000 : 500000; // in kobo
  const reference = `sub_${user.id}_${Date.now()}`;

  // Paystack: initialize transaction (auto-creates recurring subscription on charge.success)
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      reference,
      metadata: {
        type: "subscription",
        userId: user.id,
        role: user.role,
      },
      callback_url: `${process.env.NEXTAUTH_URL || "https://novaclio.io"}/dashboard?subscription=success`,
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return NextResponse.json(
      { error: paystackData.message || "Paystack error" },
      { status: 502 }
    );
  }

  // Create or update subscription as TRIALING
  await db.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: user.role === "CREATOR" ? "CREATOR_MONTHLY" : "BRAND_MONTHLY",
      status: "TRIALING",
      paystackRef: reference,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
    },
    update: {
      paystackRef: reference,
      status: "TRIALING",
    },
  });

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
  });
}
