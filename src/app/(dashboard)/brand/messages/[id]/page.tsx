import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ChatRoom from "./_components/ChatRoom";

export default async function BrandChatPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "BRAND") redirect("/login");

  const userId = (session.user as any).id as string;

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      brand:   { include: { user: { select: { id: true, name: true } } } },
      creator: { include: { user: { select: { id: true, name: true } } } },
      campaign: { select: { id: true, title: true } },
    },
  });

  if (!conv || conv.brand.user.id !== userId) notFound();

  const messages = await db.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Mark incoming as read on load
  await db.message.updateMany({
    where: { conversationId: params.id, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  const otherName = conv.creator.user.name ?? "Creator";

  return (
    <ChatRoom
      conversationId={params.id}
      currentUserId={userId}
      otherName={otherName}
      creatorId={conv.creatorId}
      campaignTitle={conv.campaign?.title ?? null}
      initialMessages={messages as any}
    />
  );
}
