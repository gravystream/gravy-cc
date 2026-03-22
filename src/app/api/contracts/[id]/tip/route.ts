import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = params;

  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract)
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  if (contract.brandId !== brand.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { amountKobo } = await req.json();
  if (!amountKobo || amountKobo < 10000)
    return NextResponse.json({ error: "Minimum tip is 10000 kobo (NGN 100)" }, { status: 400 });

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
        description: "Tip for contract " + id,
      },
    }),
  ]);

  return NextResponse.json({ success: true, amountKobo });
}
