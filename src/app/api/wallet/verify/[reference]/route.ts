import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { reference: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { reference } = params;

  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Verify with Paystack
  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/verify/" + reference,
    {
      headers: {
        Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
      },
    }
  );

  if (!paystackRes.ok)
    return NextResponse.json({ error: "Paystack verification failed" }, { status: 400 });

  const paystackData = await paystackRes.json();

  if (paystackData.data?.status !== "success")
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });

  const amountKobo = paystackData.data.amount; // Paystack returns in kobo

  // Find the pending transaction
  const pendingTx = await db.brandWalletTransaction.findFirst({
    where: { reference, status: "PENDING" },
    include: { wallet: true },
  });

  if (!pendingTx)
    return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 404 });

  // Credit wallet
  await db.$transaction(async (tx) => {
    await tx.brandWallet.update({
      where: { id: pendingTx.walletId },
      data: { balance: { increment: amountKobo } },
    });
    await tx.brandWalletTransaction.update({
      where: { id: pendingTx.id },
      data: { status: "COMPLETED", amountKobo },
    });
  });

  return NextResponse.json({ success: true, amountKobo });
}
