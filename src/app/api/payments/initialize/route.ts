import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/payments/initialize — brand initiates escrow deposit for a job
// Body: { jobId: string }
// Returns: { authorizationUrl, reference } — brand is redirected to Paystack
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  const { jobId } = await req.json();
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  // Fetch job and verify brand ownership
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { campaign: true, escrow: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (job.escrow?.status === "FUNDED" || job.escrow?.status === "RELEASED") {
    return NextResponse.json({ error: "Escrow already funded or released" }, { status: 400 });
  }

  const amountKobo = job.agreedRateKobo;
  const platformFeeKobo = Math.round(amountKobo * 0.12); // 12% platform fee
  const totalKobo = amountKobo; // brand pays the agreed rate, fee deducted on release

  // Generate unique reference
  const reference = `escrow_${jobId}_${Date.now()}`;

  // Upsert escrow record as PENDING
  const escrow = await db.escrow.upsert({
    where: { jobId },
    create: {
      jobId,
      amountKobo: totalKobo,
      platformFeeKobo,
      status: "PENDING",
      paystackRef: reference,
    },
    update: {
      paystackRef: reference,
      status: "PENDING",
    },
  });

  // Call Paystack transaction/initialize
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      amount: totalKobo, // Paystack expects kobo
      reference,
      metadata: {
        type: "escrow_deposit",
        jobId,
        escrowId: escrow.id,
        userId: session.user.id,
      },
      callback_url: `${process.env.NEXTAUTH_URL || "https://novaclio.io"}/brand/jobs/${jobId}?payment=success`,
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return NextResponse.json(
      { error: paystackData.message || "Paystack error" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
    escrowId: escrow.id,
  });
}
