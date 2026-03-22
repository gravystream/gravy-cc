"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, DollarSign, FileText, X, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string | null };
};

type Props = {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  creatorId: string;
  campaignTitle: string | null;
  initialMessages: Message[];
};

export default function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  creatorId,
  campaignTitle,
  initialMessages,
}: Props) {
  const [messages, setMessages]   = useState<Message[]>(initialMessages);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<NodeJS.Timeout | null>(null);

  // Contract modal
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    deliverable: "",
    platform: "Instagram",
    deadline: "",
    amountNaira: "",
    revisions: "1",
    usageRights: "",
    additionalTerms: "",
  });
  const [creatingContract, setCreatingContract] = useState(false);
  const [contractError, setContractError]       = useState("");

  // Tip modal
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount]       = useState("");
  const [sendingTip, setSendingTip]     = useState(false);
  const [tipError, setTipError]         = useState("");
  const [tipSuccess, setTipSuccess]     = useState("");

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 4 s
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
    setInput("");
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "You" },
    };
    setMessages((prev) => [...prev, optimistic]);
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

  const handleCreateContract = async () => {
    setContractError("");
    const amountKobo = Math.round(parseFloat(contractForm.amountNaira) * 100);
    if (!contractForm.deliverable || !contractForm.deadline || isNaN(amountKobo) || amountKobo < 100) {
      setContractError("Please fill in all required fields. Minimum amount is 1.");
      return;
    }
    setCreatingContract(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          creatorId,
          deliverable: contractForm.deliverable,
          platform: contractForm.platform,
          deadline: contractForm.deadline,
          amountKobo,
          revisions: parseInt(contractForm.revisions),
          usageRights: contractForm.usageRights || undefined,
          additionalTerms: contractForm.additionalTerms || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContractError(data.error ?? "Failed to create contract.");
        return;
      }
      setShowContractModal(false);
      window.location.href = `/brand/contracts/${data.contractId}`;
    } catch {
      setContractError("Network error. Please try again.");
    } finally {
      setCreatingContract(false);
    }
  };

  const handleTip = async () => {
    setTipError("");
    setTipSuccess("");
    const amountKobo = Math.round(parseFloat(tipAmount) * 100);
    if (isNaN(amountKobo) || amountKobo < 10000) {
      setTipError("Minimum tip is 100.");
      return;
    }
    setSendingTip(true);
    try {
      const res = await fetch("/api/wallet/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, amountKobo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTipError(data.error ?? "Failed to send tip.");
        return;
      }
      setTipSuccess(`${parseFloat(tipAmount).toLocaleString()} tip sent successfully!`);
      setTipAmount("");
      setTimeout(() => { setShowTipModal(false); setTipSuccess(""); }, 2000);
    } catch {
      setTipError("Network error. Please try again.");
    } finally {
      setSendingTip(false);
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
        <Link href="/brand/messages" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-violet-900 flex items-center justify-center text-violet-300 font-bold text-sm">
          {otherName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{otherName}</p>
          {campaignTitle && (
            <p className="text-xs text-violet-400 truncate">{campaignTitle}</p>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-green-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
          Live chat
        </span>
        <button
          onClick={() => { setShowContractModal(true); setContractError(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors ml-2"
        >
          <FileText className="w-3.5 h-3.5" />
          Hire Creator
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            <div className="text-center my-4">
              <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                {day}
              </span>
            </div>
            {msgs.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-violet-300" : "text-gray-500"} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
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
            onClick={() => { setShowTipModal(true); setTipError(""); setTipSuccess(""); }}
            className="p-1.5 rounded-full bg-yellow-600 hover:bg-yellow-500 transition-colors flex-shrink-0"
            title="Send a tip"
          >
            <DollarSign className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 text-center">Shift+Enter for new line</p>
      </div>

      {/* Contract Creation Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-white font-semibold text-lg">Create Contract</h2>
              <button onClick={() => setShowContractModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deliverable *</label>
                <textarea
                  value={contractForm.deliverable}
                  onChange={(e) => setContractForm({ ...contractForm, deliverable: e.target.value })}
                  placeholder="Describe what the creator needs to deliver..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Platform *</label>
                  <select
                    value={contractForm.platform}
                    onChange={(e) => setContractForm({ ...contractForm, platform: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                  >
                    {["Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "LinkedIn", "Snapchat", "Other"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Deadline *</label>
                  <input
                    type="date"
                    value={contractForm.deadline}
                    onChange={(e) => setContractForm({ ...contractForm, deadline: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Amount () *</label>
                  <input
                    type="number"
                    value={contractForm.amountNaira}
                    onChange={(e) => setContractForm({ ...contractForm, amountNaira: e.target.value })}
                    placeholder="e.g. 50000"
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Revisions allowed</label>
                  <input
                    type="number"
                    value={contractForm.revisions}
                    onChange={(e) => setContractForm({ ...contractForm, revisions: e.target.value })}
                    min="0"
                    max="10"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Usage rights</label>
                <input
                  type="text"
                  value={contractForm.usageRights}
                  onChange={(e) => setContractForm({ ...contractForm, usageRights: e.target.value })}
                  placeholder="e.g. 30-day social media usage"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Additional terms</label>
                <textarea
                  value={contractForm.additionalTerms}
                  onChange={(e) => setContractForm({ ...contractForm, additionalTerms: e.target.value })}
                  placeholder="Any additional terms or notes..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 resize-none"
                />
              </div>
              {contractError && (
                <p className="text-red-400 text-xs">{contractError}</p>
              )}
              <p className="text-xs text-gray-500">
                The contract amount will be locked in escrow from your wallet when the creator signs.
              </p>
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowContractModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContract}
                disabled={creatingContract}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {creatingContract ? "Creating..." : "Send Contract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-white font-semibold text-lg">Send a Tip</h2>
              <button onClick={() => setShowTipModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">Send a tip to <span className="text-white font-medium">{otherName}</span></p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount ()</label>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="e.g. 500"
                  min="100"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500"
                />
                <p className="text-xs text-gray-600 mt-1">Minimum tip: 100</p>
              </div>
              <div className="flex gap-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(String(amt))}
                    className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              {tipError && <p className="text-red-400 text-xs">{tipError}</p>}
              {tipSuccess && <p className="text-green-400 text-xs">{tipSuccess}</p>}
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={sendingTip}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {sendingTip ? "Sending..." : "Send Tip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
