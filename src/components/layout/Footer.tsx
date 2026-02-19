import React from "react";
import Link from "next/link";

const LINKS = {
  Platform: ["For Creators", "For Brands", "How It Works", "Pricing"],
  Company:  ["About Us", "Blog", "Careers", "Press"],
  Legal:    ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  Support:  ["Help Center", "Contact Us", "Community"],
};

export function Footer() {
  return (
    <footer className="border-t border-[#1E1E1E] bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#D4A843] flex items-center justify-center">
                <span className="text-black font-bold text-xs font-quicksand">G</span>
              </div>
              <span className="font-bold text-white font-quicksand">
                Gravy<span className="text-[#D4A843]">CC</span>
              </span>
            </div>
            <p className="text-xs text-[#808080] leading-relaxed max-w-[180px]">
              The AI-powered creator marketplace where brands discover premium video talent.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-[#444444] uppercase tracking-wider mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l}>
                    <Link href="#" className="text-sm text-[#808080] hover:text-white transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E1E] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#444444]">
            © 2025 Gravy Command Center. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-[#444444]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
