import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const wallet = await db.brandWallet.findUnique({
    where: { brandId: brand.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!wallet) {
    return NextResponse.json({ balance: 0, transactions: [] });
  }

  return NextResponse.json({
    balance: wallet.balance,
    transactions: wallet.transactions,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { amountKobo } = await req.json();

  if (!amountKobo || amountKobo < 100000)
    return NextResponse.json({ error: "Minimum top-up is NGN 1000 (100000 kobo)" }, { status: 400 });

  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Get or create wallet
  let wallet = await db.brandWallet.findUnique({ where: { brandId: brand.id } });
  if (!wallet) {
    wallet = await db.brandWallet.create({ data: { brandId: brand.id, balance: 0 } });
  }

  // Generate reference
  const reference = "wlt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

  // Initialize Paystack transaction
  const paystackResponse = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: (session.user as any).email,
        amount: amountKobo,
        reference,
        callback_url: process.env.NEXTAUTH_URL + "/brand/wallet?ref=" + reference,
      }),
    }
  );

  if (!paystackResponse.ok) {
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }

  const paystackData = await paystackResponse.json();

  // Create pending transaction
  await db.brandWalletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "TOPUP",
      amountKobo,
      status: "PENDING",
      reference,
    },
  });

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference,
  });
}
