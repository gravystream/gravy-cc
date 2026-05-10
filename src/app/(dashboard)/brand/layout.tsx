"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/LogoutButton";

const navLinks = [
  { href: "/brand", label: "Discover", icon: "🔍" },
  { href: "/brand/campaigns/new", label: "New Campaign", icon: "🚀" },
  { href: "/brand/wallet", label: "Wallet", icon: "💳" },
  { href: "/brand/contracts", label: "Contracts", icon: "📝" },
  { href: "/brand/analytics", label: "Analytics", icon: "📈" },
  { href: "/brand/links", label: "Links & Metrics", icon: "🔗" },
  { href: "/brand/bonuses", label: "Bonuses Owed", icon: "💰" },
  { href: "/brand/smart-match", label: "Smart Match", icon: "✨" },
  { href: "/brand/api", label: "API Access", icon: "🔑" },
  { href: "/brand/profile", label: "Profile", icon: "👤" },
];

const bottomTabs = [
  { href: "/brand", label: "Discover", icon: "🔍" },
  { href: "/brand/campaigns/new", label: "Campaign", icon: "🚀" },
  { href: "/brand/wallet", label: "Wallet", icon: "💳" },
  { href: "/brand/analytics", label: "Analytics", icon: "📈" },
  { href: "/brand/profile", label: "Profile", icon: "👤" },
];

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/brand" ? pathname === "/brand" : pathname.startsWith(href);

  const NavContent = () => (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Novaclio</h2>
        <p className="text-gray-400 text-sm">Brand Portal</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(link.href)
                ? "bg-blue-600/20 text-blue-400 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2 -ml-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="text-white font-semibold text-lg">Novaclio</h1>
        <NotificationBell />
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 p-6 flex flex-col overflow-y-auto animate-slide-in">
            <NavContent />
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 p-6 flex-col fixed top-0 left-0 bottom-0 overflow-y-auto">
          <NavContent />
          <div className="pt-4 border-t border-gray-800 mt-4 flex items-center justify-between">
            <span className="text-gray-500 text-xs">Notifications</span>
            <NotificationBell />
          </div>
          <LogoutButton />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
        <div className="flex items-center justify-around py-2 px-1">
          {bottomTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 ${
                isActive(tab.href)
                  ? "text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium truncate">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
