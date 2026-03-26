"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-[#808080] text-sm mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-[#D4A843] text-sm hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {success ? "Password Reset!" : "Set new password"}
          </h1>
          <p className="text-[#808080] text-sm">
            {success
              ? "Your password has been reset successfully."
              : "Enter your new password below."}
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <Link
              href="/login"
              className="inline-block mt-4 bg-[#D4A843] text-black font-bold rounded-xl px-8 py-3 text-sm hover:bg-[#C49C38] transition-colors"
            >
              Go to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="New password"
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white placeholder-[#444444] rounded-xl px-4 py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-[#D4A843] transition-colors"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#808080]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
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
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><span className="text-[#808080] text-sm">Loading...</span></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
