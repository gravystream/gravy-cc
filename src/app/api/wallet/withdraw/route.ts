import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/wallet/withdraw — creator initiates a bank payout
// Body: { amountKobo, bankCode, accountNumber, accountName }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  const { amountKobo, bankCode, accountNumber, accountName } = await req.json();
  if (!amountKobo || !bankCode || !accountNumber || !accountName) {
    return NextResponse.json(
      { error: "amountKobo, bankCode, accountNumber, accountName are required" },
      { status: 400 }
    );
  }

  if (amountKobo < 100000) { // minimum N1,000
    return NextResponse.json({ error: "Minimum withdrawal is ₦1,000" }, { status: 400 });
  }

  const wallet = await db.wallet.findUnique({ where: { creatorId: session.user.id } });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }
  if (wallet.balanceKobo < amountKobo) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Step 1: Create Paystack transfer recipient
  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
  const recipientData = await recipientRes.json();
  if (!recipientData.status) {
    return NextResponse.json({ error: recipientData.message || "Failed to create recipient" }, { status: 502 });
  }

  const recipientCode = recipientData.data.recipient_code;

  // Step 2: Initiate transfer
  const transferRef = `withdraw_${session.user.id}_${Date.now()}`;
  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountKobo,
      recipient: recipientCode,
      reason: "Novaclio creator payout",
      reference: transferRef,
    }),
  });
  const transferData = await transferRes.json();
  if (!transferData.status) {
    return NextResponse.json({ error: transferData.message || "Transfer failed" }, { status: 502 });
  }

  // Step 3: Deduct from wallet and record transaction
  await db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { creatorId: session.user.id },
      data: { balanceKobo: { decrement: amountKobo } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amountKobo,
        type: "WITHDRAWAL",
        description: `Payout to ${accountName} (${bankCode} ${accountNumber})`,
      },
    });

    // Update wallet bank details
    await tx.wallet.update({
      where: { creatorId: session.user.id },
      data: {
        bankName: bankCode,
        bankCode,
        accountNumber,
        accountName,
        paystackRecipientCode: recipientCode,
      },
    });
  });

  return NextResponse.json({
    success: true,
    transferReference: transferRef,
    amountKobo,
  });
}
