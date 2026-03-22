import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/conversations/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const convId = params.id;

  try {
    const conv = await db.conversation.findUnique({
      where: { id: convId },
      include: {
        brand:   { include: { user: { select: { id: true, name: true } } } },
        creator: { include: { user: { select: { id: true, name: true } } } },
        campaign: { select: { id: true, title: true } },
      },
    });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Access check: user must be the brand owner or the creator
    const isBrandOwner   = conv.brand.user.id   === userId;
    const isCreatorOwner = conv.creator.user.id === userId;
    if (!isBrandOwner && !isCreatorOwner)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await db.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true } } },
    });

    // Mark incoming messages as read
    await db.message.updateMany({
      where: { conversationId: convId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ messages, conversation: conv });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const convId = params.id;
  const { content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  try {
    const conv = await db.conversation.findUnique({
      where: { id: convId },
      include: {
        brand:   { include: { user: { select: { id: true } } } },
        creator: { include: { user: { select: { id: true } } } },
      },
    });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isBrandOwner   = conv.brand.user.id   === userId;
    const isCreatorOwner = conv.creator.user.id === userId;
    if (!isBrandOwner && !isCreatorOwner)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [message] = await db.$transaction([
      db.message.create({
        data: { conversationId: convId, senderId: userId, content: content.trim() },
        include: { sender: { select: { id: true, name: true } } },
      }),
      db.conversation.update({
        where: { id: convId },
        data:  { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
