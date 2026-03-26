"use client";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res?.ok) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }
      const sess = await fetch("/api/auth/verify-admin");
      const data = await sess.json();
      if (!data.isAdmin) {
        setError("Access restricted to authorized personnel only");
        await signOut({ redirect: false });
        setLoading(false);
        return;
      }
      window.location.href = "/admin";
    } catch (err) {
      setError("Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Novaclio Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">Administrative Access</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#111111] border border-gray-800 rounded-xl p-6 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="admin@novaclio.io" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="********" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50">
            {loading ? "Authenticating..." : "Access Control Panel"}
          </button>
        </form>
        <p className="text-center text-gray-600 text-xs mt-6">Secured administrative portal - Novaclio Inc.</p>
      </div>
    </div>
  );
}
