import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/conversations - list all conversations for the current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role   = (session.user as any).role as string;

  try {
    let conversations;
    if (role === "BRAND") {
      const brand = await db.brandProfile.findUnique({ where: { userId } });
      if (!brand) return NextResponse.json({ conversations: [] });

      conversations = await db.conversation.findMany({
        where: { brandId: brand.id },
        orderBy: { updatedAt: "desc" },
        include: {
          creator: { include: { user: { select: { name: true } } } },
          campaign: { select: { id: true, title: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true, isRead: true, senderId: true },
          },
        },
      });
    } else {
      const creator = await db.creatorProfile.findUnique({ where: { userId } });
      if (!creator) return NextResponse.json({ conversations: [] });

      conversations = await db.conversation.findMany({
        where: { creatorId: creator.id },
        orderBy: { updatedAt: "desc" },
        include: {
          brand: { include: { user: { select: { name: true } } } },
          campaign: { select: { id: true, title: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true, isRead: true, senderId: true },
          },
        },
      });
    }

    // Attach unread count per conversation
    const withUnread = await Promise.all(
      conversations.map(async (c: any) => {
        const unread = await db.message.count({
          where: { conversationId: c.id, isRead: false, senderId: { not: userId } },
        });
        return { ...c, unreadCount: unread };
      })
    );

    return NextResponse.json({ conversations: withUnread });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations - find or create a conversation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role   = (session.user as any).role as string;

  if (role !== "BRAND") {
    return NextResponse.json({ error: "Only brands can initiate conversations" }, { status: 403 });
  }

  const { creatorId, campaignId, subject } = await req.json();
  if (!creatorId) return NextResponse.json({ error: "creatorId required" }, { status: 400 });

  try {
    const brand = await db.brandProfile.findUnique({ where: { userId } });
    if (!brand) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });

  // find existing conversation or create new one
  // (Prisma upsert doesn't work when null is in a composite unique key)
  let conversation = await db.conversation.findFirst({
    where: {
      brandId:    brand.id,
      creatorId:  creatorId,
      campaignId: campaignId ?? null,
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        brandId:    brand.id,
        creatorId:  creatorId,
        campaignId: campaignId ?? null,
        subject:    subject ?? null,
      },
    });
  } else {
    await db.conversation.update({
      where: { id: conversation.id },
      data:  { updatedAt: new Date() },
    });
  }

  return NextResponse.json({ conversationId: conversation.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
