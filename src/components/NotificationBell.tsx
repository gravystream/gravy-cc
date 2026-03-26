"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "./NotificationProvider";
import Link from "next/link";

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_BRIEF_MATCH: "",
  PROPOSAL_RECEIVED: "",
  PROPOSAL_QUALIFIED: "",
  PROPOSAL_SELECTED: "",
  PROPOSAL_REJECTED: "",
  DIRECT_HIRE_OFFER: "",
  JOB_ASSIGNED: "",
  REVISION_REQUESTED: "",
  JOB_APPROVED: "",
  PAYMENT_RELEASED: "",
  PAYMENT_RECEIVED: "",
  REVIEW_RECEIVED: "",
  SUBSCRIPTION_RENEWAL: "",
  SUBSCRIPTION_EXPIRED: "",
  DISPUTE_OPENED: "",
  DISPUTE_RESOLVED: "",
  SYSTEM: "",
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead, latestNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Toast for new notifications */}
      {latestNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg">{NOTIFICATION_ICONS[latestNotification.type] || ""}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{latestNotification.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{latestNotification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bell + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          aria-label="Notifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      if (n.link) {
                        setIsOpen(false);
                        window.location.href = n.link;
                      }
                    }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-800 ${
                      n.isRead ? "opacity-60" : "bg-gray-800/50"
                    } hover:bg-gray-800`}
                  >
                    <span className="text-base mt-0.5">{NOTIFICATION_ICONS[n.type] || ""}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? "text-gray-400" : "text-white font-medium"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
