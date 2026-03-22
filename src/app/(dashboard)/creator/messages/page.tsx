import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessageSquare } from "lucide-react";

export default async function CreatorMessagesPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CREATOR") redirect("/login");

  const userId = (session.user as any).id as string;
  const creator = await db.creatorProfile.findUnique({ where: { userId } });
  if (!creator) redirect("/creator");

  const conversations = await db.conversation.findMany({
    where: { creatorId: creator.id },
    orderBy: { updatedAt: "desc" },
    include: {
      brand: { include: { user: { select: { name: true } } } },
      campaign: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const convWithUnread = await Promise.all(
    conversations.map(async (c) => {
      const unread = await db.message.count({
        where: { conversationId: c.id, isRead: false, senderId: { not: userId } },
      });
      return { ...c, unreadCount: unread };
    })
  );

  const totalUnread = convWithUnread.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 mt-1">Conversations with brands about campaigns</p>
        </div>
        {totalUnread > 0 && (
          <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {totalUnread} unread
          </span>
        )}
      </div>

      {convWithUnread.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No messages yet</p>
          <p className="text-gray-500 text-sm">
            When a brand reaches out about a campaign, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {convWithUnread.map((conv) => {
            const lastMsg = conv.messages[0];
            const brandName = conv.brand.user.name ?? conv.brand.companyName ?? "Brand";
            return (
              <Link
                key={conv.id}
                href={`/creator/messages/${conv.id}`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  conv.unreadCount > 0
                    ? "bg-gray-900 border-violet-700/50 hover:border-violet-600"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm flex-shrink-0">
                  {brandName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-white text-sm truncate">{brandName}</p>
                    {lastMsg && (
                      <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                        {new Date(lastMsg.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  {conv.campaign && (
                    <p className="text-xs text-violet-400 mb-0.5"> {conv.campaign.title}</p>
                  )}
                  <p className="text-gray-400 text-sm truncate">
                    {lastMsg ? lastMsg.content : "New conversation  reply to start!"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
