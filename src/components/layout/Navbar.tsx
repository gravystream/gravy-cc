"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "For Creators", href: "#creators" },
  { label: "For Brands",   href: "#brands" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#1E1E1E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#D4A843] flex items-center justify-center">
              <span className="text-black font-bold text-sm font-quicksand">G</span>
            </div>
            <span className="font-bold text-lg text-white font-quicksand tracking-tight">
              Gravy<span className="text-[#D4A843]">CC</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-[#808080] hover:text-white transition-colors duration-150"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gold" size="sm">Get Started →</Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-9 h-9 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[#1E1E1E] py-4 space-y-1 animate-fade-in">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block px-3 py-2.5 text-sm text-[#808080] hover:text-white rounded-lg hover:bg-[#1E1E1E] transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 px-3">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button variant="gold" size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
