"use client";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Join Novaclio</h1>
          <p className="text-gray-400 mt-2">Choose how you want to use Novaclio</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/signup/creator">
            <div className="bg-gray-900 border border-gray-800 hover:border-violet-500 rounded-2xl p-6 cursor-pointer transition-all text-center group">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-white font-semibold text-lg">Creator</h3>
              <p className="text-gray-400 text-sm mt-2">Find brand deals and grow your income</p>
            </div>
          </Link>

          <Link href="/signup/brand">
            <div className="bg-gray-900 border border-gray-800 hover:border-violet-500 rounded-2xl p-6 cursor-pointer transition-all text-center group">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-white font-semibold text-lg">Brand</h3>
              <p className="text-gray-400 text-sm mt-2">Discover creators and run campaigns</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
