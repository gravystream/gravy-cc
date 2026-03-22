import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (id === "all") {
    await db.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
    return NextResponse.json({ success: true, markedAll: true });
  }
  const notification = await db.notification.findUnique({ where: { id: id } });
  if (!notification || notification.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.notification.update({ where: { id: id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
