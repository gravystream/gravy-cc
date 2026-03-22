import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { creatorId, amountKobo } = await req.json();

  if (!creatorId || !amountKobo || amountKobo < 10000)
    return NextResponse.json({ error: "creatorId and amountKobo (min 10000) required" }, { status: 400 });

  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });

  const wallet = await db.brandWallet.findUnique({ where: { brandId: brand.id } });
  if (!wallet || wallet.balance < amountKobo)
    return NextResponse.json({ error: "Insufficient wallet balance. Please top up." }, { status: 400 });

  await db.$transaction([
    db.brandWallet.update({
      where: { brandId: brand.id },
      data: { balance: { decrement: amountKobo } },
    }),
    db.brandWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "TIP_SENT",
        amountKobo,
        status: "COMPLETED",
        description: `Tip to creator ${creatorId}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, amountKobo });
}
