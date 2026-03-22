import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CREATOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { id } = params;

  const creator = await db.creatorProfile.findUnique({ where: { userId } });
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  const contract = await db.contract.findUnique({ where: { id } });
  if (!contract)
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  if (contract.creatorId !== creator.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (contract.status !== "PENDING_CREATOR_SIGN")
    return NextResponse.json({ error: "Contract is not awaiting your signature" }, { status: 400 });

  const wallet = await db.brandWallet.findUnique({ where: { brandId: contract.brandId } });
  if (!wallet || wallet.balance < contract.amountKobo)
    return NextResponse.json({ error: "Brand has insufficient wallet balance to fund this contract" }, { status: 400 });

  try {
    await db.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id },
        data: {
          status: "ACTIVE",
          creatorSignedAt: new Date(),
        },
      });

      await tx.brandWallet.update({
        where: { brandId: contract.brandId },
        data: { balance: { decrement: contract.amountKobo } },
      });

      await tx.brandWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ESCROW_LOCK",
          amountKobo: contract.amountKobo,
          status: "COMPLETED",
          reference: "escrow_" + id,
        },
      });

      await tx.contractEscrow.create({
        data: {
          contractId: id,
          amountKobo: contract.amountKobo,
          status: "HELD",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contracts/[id]/sign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
