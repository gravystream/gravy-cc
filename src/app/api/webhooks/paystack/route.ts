import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";

  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { metadata, reference, amount } = event.data;
    const jobId = metadata?.jobId;
    const escrowId = metadata?.escrowId;

    if (!jobId) {
      console.error("Paystack webhook: no jobId in metadata", metadata);
      return NextResponse.json({ received: true });
    }

    try {
      await db.$transaction(async (tx) => {
        // Update escrow to FUNDED
        if (escrowId) {
          await tx.escrow.update({
            where: { id: escrowId },
            data: {
              status: "FUNDED",
              paystackRef: reference,
            },
          });
        }

        // Update job to IN_PROGRESS
        await tx.job.update({
          where: { id: jobId },
          data: { status: "IN_PROGRESS" },
        });
      });

      console.log(`Paystack: Job ${jobId} funded and set to IN_PROGRESS`);
    } catch (err) {
      console.error("Paystack webhook DB error:", err);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
