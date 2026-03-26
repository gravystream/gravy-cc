"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MessagesNavLink() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const isActive = pathname.startsWith("/brand/messages");

  // Use ref to prevent duplicate fetches in React strict mode
  const hasFetched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const res = await fetch("/api/conversations/unread-count");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnread(data.count ?? 0);
        }
      } catch {}
    }
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchUnread();
    }
    const interval = setInterval(fetchUnread, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <Link
      href="/brand/messages"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-violet-600/20 text-violet-300"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <span></span>
      <span>Messages</span>
      {unread > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
