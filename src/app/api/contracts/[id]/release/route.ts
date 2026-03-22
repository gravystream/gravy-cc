import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = params;

  const brand = await db.brandProfile.findUnique({ where: { userId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const contract = await db.contract.findUnique({
    where: { id },
    include: { escrowPayment: true },
  });

  if (!contract)
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  if (contract.brandId !== brand.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (contract.status !== "SUBMITTED")
    return NextResponse.json({ error: "Contract is not in submitted status" }, { status: 400 });

  const escrow = contract.escrowPayment;
  if (!escrow || escrow.status !== "HELD")
    return NextResponse.json({ error: "No held escrow found" }, { status: 400 });

  const wallet = await db.brandWallet.findUnique({
    where: { brandId: brand.id },
  });
  if (!wallet)
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  try {
    await db.$transaction(async (tx) => {
      await tx.contractEscrow.update({
        where: { id: escrow.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });

      await tx.contract.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      await tx.brandWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ESCROW_RELEASE",
          amountKobo: escrow.amountKobo,
          status: "COMPLETED",
          reference: "release_" + id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contracts/[id]/release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
