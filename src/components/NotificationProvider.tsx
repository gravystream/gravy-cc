"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  refreshNotifications: () => void;
  latestNotification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  markAsRead: () => {},
  markAllRead: () => {},
  refreshNotifications: () => {},
  latestNotification: null,
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err);
    }
  }, []);

  const connectSocket = useCallback(async () => {
    try {
      const authRes = await fetch("/api/socket-auth");
      if (!authRes.ok) return;
      const { userId, token } = await authRes.json();

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      const socket = io(socketUrl, {
        path: "/socket.io",
        auth: { userId, token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("notification:new", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
        setUnreadCount((prev) => prev + 1);
        setLatestNotification(notification);
        // Clear toast after 5s
        setTimeout(() => setLatestNotification(null), 5000);
      });

      socket.on("notification:marked-read", (notificationId: string) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      socket.on("notifications:all-marked-read", () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error("[Socket] Connection error:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchNotifications, connectSocket]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      socketRef.current?.emit("notification:read", id);
    } catch (err) {
      console.error("[Notifications] Mark read error:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      socketRef.current?.emit("notifications:read-all");
    } catch (err) {
      console.error("[Notifications] Mark all read error:", err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllRead,
        refreshNotifications: fetchNotifications,
        latestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
