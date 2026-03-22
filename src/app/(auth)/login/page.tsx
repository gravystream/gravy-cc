"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.error) { setError("Invalid email or password. Please try again."); setLoading(false); return; }
      if (callbackUrl && callbackUrl.startsWith("/")) { router.push(callbackUrl); }
      else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        router.push(session?.user?.role === "BRAND" ? "/brand" : "/creator");
      }
      router.refresh();
    } catch { setError("Something went wrong. Please try again."); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#D4A843]/5 rounded-full blur-[80px] pointer-events-none" />
        <Link href="/" className="relative z-10">
          <span className="font-bold text-white text-xl font-quicksand">N<span className="text-[#D4A843]">✦</span>vaclio</span>
        </Link>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">Your creator<br />business starts<br /><span className="text-[#D4A843]">right here.</span></h2>
            <p className="text-[#808080] text-base leading-relaxed max-w-sm">Join thousands of creators earning from brand deals, and brands finding premium video talent — all in one platform.</p>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#1E1E1E] bg-[#111111]/80 backdrop-blur-sm max-w-xs">
            <div className="flex -space-x-2">
              {["#D4A843","#22C55E","#60A5FA","#F59E0B"].map((c,i)=>(<div key={i} className="w-8 h-8 rounded-full border-2 border-[#111111]" style={{background:c,opacity:0.85}}/>))}
            </div>
            <div><p className="text-white text-sm font-semibold">50,000+ creators</p><p className="text-[#808080] text-xs">active on the platform</p></div>
          </div>
        </div>
        <div className="relative z-10 p-4 rounded-2xl border border-[#1E1E1E] bg-[#111111]/60 backdrop-blur-sm">
          <p className="text-sm text-[#C7C7C7] italic leading-relaxed mb-3">&ldquo;Novaclio changed how I monetize my content. Three brand deals in my first week.&rdquo;</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#D4A843]/20 flex items-center justify-center"><span className="text-[#D4A843] text-xs font-bold">A</span></div>
            <div><p className="text-white text-xs font-semibold">Ada C.</p><p className="text-[#808080] text-xs">Fashion Creator · Lagos</p></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center mb-8 lg:hidden">
            <span className="font-bold text-white text-xl font-quicksand">N<span className="text-[#D4A843]">✦</span>vaclio</span>
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-[#808080] text-sm">Don&apos;t have an account?{" "}<Link href="/signup" className="text-[#D4A843] hover:underline font-medium">Sign up</Link></p>
          </div>
          <button onClick={() => signIn("google", { callbackUrl: callbackUrl || "/creator" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#2D2D2D] bg-[#111111] hover:bg-[#1a1a1a] hover:border-[#444444] transition-all text-sm font-medium text-white mb-6" type="button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9087-2.2582c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.2818-1.1168-.2818-1.71s.1018-1.17.2818-1.71V4.9582H.9573C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
              <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#1E1E1E]"/><span className="text-[#444444] text-xs">or continue with email</span><div className="flex-1 h-px bg-[#1E1E1E]"/>
          </div>
          {error && <div className="mb-4 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#C7C7C7] mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]"/>
                <input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white placeholder-[#444444] rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-[#D4A843] transition-colors" required/>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#C7C7C7]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#808080] hover:text-[#D4A843] transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444444]"/>
                <input type={showPassword?"text":"password"} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Enter your password" autoComplete="current-password"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white placeholder-[#444444] rounded-xl px-4 py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-[#D4A843] transition-colors" required/>
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#808080]">
                  {showPassword?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full !rounded-xl !bg-[#D4A843] !text-black hover:!bg-[#C49C38] mt-2">
              {loading?"Signing in…":"Sign in"}{!loading&&<ArrowRight size={16}/>}
            </Button>
          </form>
          <p className="text-[#444444] text-xs text-center mt-6 leading-relaxed">
            By signing in, you agree to our{" "}<Link href="/terms" className="hover:text-[#808080] underline">Terms of Service</Link>{" "}and{" "}<Link href="/privacy" className="hover:text-[#808080] underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><span className="text-[#808080] text-sm">Loading…</span></div>}>
      <LoginForm />
    </Suspense>
  );
}
