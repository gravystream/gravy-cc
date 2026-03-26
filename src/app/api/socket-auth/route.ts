import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a simple HMAC token the socket server can verify
  const userId = (session.user as any).id;
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
  const token = crypto
    .createHmac("sha256", secret)
    .update(userId + Date.now().toString().slice(0, -4)) // ~10s granularity
    .digest("hex");

  return NextResponse.json({ userId, token });
}
