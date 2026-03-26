import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ isOAuthOnly: false });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { passwordHash: true, id: true },
    });

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({ isOAuthOnly: false });
    }

    // User exists but has no password = signed up via OAuth
    if (!user.passwordHash) {
      return NextResponse.json({ isOAuthOnly: true });
    }

    return NextResponse.json({ isOAuthOnly: false });
  } catch {
    return NextResponse.json({ isOAuthOnly: false });
  }
}
