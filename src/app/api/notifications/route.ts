import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const cursor = searchParams.get("cursor");
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id, ...(unreadOnly && { isRead: false }) },
    orderBy: { createdAt: "desc" }, take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });
  const unreadCount = await db.notification.count({ where: { userId: session.user.id, isRead: false } });
  const nextCursor = notifications.length === limit ? notifications[notifications.length - 1].id : null;
  return NextResponse.json({ notifications, unreadCount, nextCursor });
}
