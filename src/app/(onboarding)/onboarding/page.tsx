"use client";

import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Novaclio!</h1>
          <p className="text-gray-400">How will you use the platform?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/onboarding/creator" className="group block p-8 bg-gray-900 border border-gray-800 rounded-2xl hover:border-purple-500/50 hover:bg-gray-900/80 transition-all duration-200">
            <div className="text-4xl mb-4">&#127912;</div>
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">I am a Creator</h2>
            <p className="text-gray-400 text-sm">Share your work, build your audience, and connect with brands for collaborations.</p>
          </Link>

          <Link href="/onboarding/brand" className="group block p-8 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-gray-900/80 transition-all duration-200">
            <div className="text-4xl mb-4">&#127970;</div>
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">I am a Brand</h2>
            <p className="text-gray-400 text-sm">Discover creators, manage campaigns, and grow your brand through authentic partnerships.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
