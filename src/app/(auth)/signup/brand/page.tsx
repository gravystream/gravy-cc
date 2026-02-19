"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BrandSignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", industry: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "BRAND" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); }
    else router.push("/login?registered=1");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Brand Sign Up</h1>
          <p className="text-gray-400 mt-2">Create your brand account</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            {[["name","Full Name","text"],["email","Email","email"],["password","Password","password"],["company","Company Name","text"],["industry","Industry","text"]].map(([field, label, type]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <input type={type} value={(form as any)[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Creating account..." : "Create Brand Account"}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-4 text-sm">
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">← Back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
