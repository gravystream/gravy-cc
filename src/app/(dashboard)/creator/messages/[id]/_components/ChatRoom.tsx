"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MessageSquare, FileText, ExternalLink } from "lucide-react";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string | null };
};

type ContractNotif = {
  contractId: string;
  deliverable: string;
  platform: string;
  amount: string;
  deadline: string;
};

type Props = {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  campaignTitle: string;
  initialMessages: Message[];
  backHref: string;
};

export default function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  campaignTitle,
  initialMessages,
  backHref,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const pollRef                 = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {}
    };
    pollRef.current = setInterval(poll, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: null },
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const day = new Date(msg.createdAt).toLocaleDateString("en-NG", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-800">
        <Link href={backHref} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {otherName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{otherName}</p>
          {campaignTitle && (
            <p className="text-gray-500 text-xs truncate max-w-[180px]">{campaignTitle}</p>
          )}
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Live chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            {/* Day divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600 px-2">{day}</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {msgs.map((msg) => {
              const isMe = msg.senderId === currentUserId;

              // ── Contract notification card ──
              if (msg.content.startsWith("CONTRACT_NOTIFICATION:")) {
                let notif: ContractNotif | null = null;
                try {
                  notif = JSON.parse(msg.content.slice("CONTRACT_NOTIFICATION:".length));
                } catch {}

                if (notif) {
                  return (
                    <div key={msg.id} className="flex justify-center my-4 px-2">
                      <div className="w-full max-w-xs bg-gray-900 border border-violet-500/40 rounded-2xl overflow-hidden shadow-xl">
                        {/* Card header */}
                        <div className="bg-gradient-to-r from-violet-900/60 to-violet-800/40 px-4 py-3 flex items-center gap-2.5 border-b border-violet-500/20">
                          <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">Contract Offer</p>
                            <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{notif.deliverable}</p>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
                          <div className="px-3 py-2.5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Platform</p>
                            <p className="text-xs text-gray-200 font-medium truncate">{notif.platform}</p>
                          </div>
                          <div className="px-3 py-2.5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Payment</p>
                            <p className="text-xs text-emerald-400 font-bold">&#8358;{notif.amount}</p>
                          </div>
                          <div className="px-3 py-2.5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Due</p>
                            <p className="text-xs text-gray-200 font-medium">{notif.deadline}</p>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="px-4 py-3">
                          <Link
                            href={`/creator/contracts/${notif.contractId}`}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Review &amp; Sign Contract
                          </Link>
                          <p className="text-[10px] text-gray-600 text-center mt-2">
                            {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              // ── Regular message bubble ──
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold mr-2 mt-1 flex-shrink-0">
                      {(msg.sender.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-gray-800 text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-600 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                      {isMe && (
                        <span className="ml-1">{msg.isRead ? "\u2713\u2713" : "\u2713"}</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-end gap-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-2 focus-within:border-violet-600 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none max-h-32"
            style={{ minHeight: "1.5rem" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 text-center">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
