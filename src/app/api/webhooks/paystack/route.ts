import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // Verify webhook signature
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, status } = event.data;
      if (status === "success") {
        await db.payment.update({
          where: { reference },
          data: { status: "SUCCESS", paystackRef: event.data.id?.toString() },
        });

        // Update proposal status to completed
        const payment = await db.payment.findUnique({ where: { reference }, include: { proposal: true } });
        if (payment) {
          await db.proposal.update({
            where: { id: payment.proposalId },
            data: { status: "COMPLETED" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
