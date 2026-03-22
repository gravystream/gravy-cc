import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });

  const userId = (session.user as any).id as string;

  try {
    const count = await db.message.count({
      where: { senderId: { not: userId }, isRead: false,
        conversation: {
          OR: [
            { brand:   { userId } },
            { creator: { userId } },
          ],
        },
      },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
