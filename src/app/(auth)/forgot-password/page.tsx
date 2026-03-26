"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {sent ? "Check your email" : "Forgot your password?"}
          </h1>
          <p className="text-[#808080] text-sm">
            {sent
              ? "If an account with that email exists, we sent a reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white placeholder-[#444444] rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-[#D4A843] transition-colors"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full !rounded-xl !bg-[#D4A843] !text-black hover:!bg-[#C49C38] mt-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4A843]/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-[#D4A843]" />
            </div>
            <p className="text-[#808080] text-sm mb-6">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-[#D4A843] text-sm hover:underline"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-[#808080] text-sm hover:text-[#D4A843] inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
