import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAndUploadQrCode } from "@/lib/qr-code";

export const dynamic = "force-dynamic";

// POST — generate (or regenerate) the QR for a creator's tracking link.
// Idempotent: pins to Cloudinary and saves the URL on the link.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const link = await db.trackingLink.findFirst({
    where: { id, creatorId: session.user.id },
    select: { id: true, shortCode: true },
  });
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  try {
    const trackingUrl = `https://novaclio.io/go/${link.shortCode}`;
    const qrCodeUrl = await generateAndUploadQrCode(trackingUrl, link.shortCode);
    const updated = await db.trackingLink.update({
      where: { id: link.id },
      data: { qrCodeUrl },
      select: { id: true, qrCodeUrl: true },
    });
    return NextResponse.json({ link: updated });
  } catch (error: any) {
    console.error("QR regenerate error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to generate QR" },
      { status: 500 }
    );
  }
}
