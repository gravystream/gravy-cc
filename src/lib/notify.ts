import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

const SOCKET_INTERNAL_URL = process.env.SOCKET_INTERNAL_URL || "http://localhost:3002";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a notification in the database AND emits it via Socket.io in real-time.
 * Use this in any API route to send real-time notifications to users.
 */
export async function notify(params: CreateNotificationParams) {
  const { userId, type, title, message, link, metadata } = params;

  // 1. Create in database
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || undefined,
    },
  });

  // 2. Emit via Socket.io (fire-and-forget, don't block on failure)
  try {
    const payload = JSON.stringify({
      userId,
      event: "notification:new",
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      },
    });

    fetch(`${SOCKET_INTERNAL_URL}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch((err) => {
      console.error("[Notify] Failed to emit socket event:", err.message);
    });
  } catch (err: any) {
    console.error("[Notify] Socket emit error:", err.message);
  }

  return notification;
}

/**
 * Emit a generic event to a user's socket room without creating a notification.
 * Useful for typing indicators, online status, etc.
 */
export async function emitToUser(userId: string, event: string, data: any) {
  try {
    await fetch(`${SOCKET_INTERNAL_URL}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch (err: any) {
    console.error("[EmitToUser] Failed:", err.message);
  }
}
