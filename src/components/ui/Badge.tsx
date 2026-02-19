import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "live" | "draft" | "progress" | "delivered" | "selected"
  | "qualified" | "pending" | "disputed" | "cancelled" | "open"
  | "direct" | "trial" | "active-sub" | "expired";

const styles: Record<BadgeVariant, string> = {
  live:        "bg-[#052E16] text-[#22C55E]",
  draft:       "bg-[#2D2D2D] text-[#808080]",
  progress:    "bg-[#1C1400] text-[#F59E0B]",
  delivered:   "bg-[#052E16] text-[#22C55E]",
  selected:    "bg-[#0C1929] text-[#60A5FA]",
  qualified:   "bg-[#052E16] text-[#22C55E]",
  pending:     "bg-[#1C1400] text-[#F59E0B]",
  disputed:    "bg-[#1C0505] text-[#EF4444]",
  cancelled:   "bg-[#1E1E1E] text-[#444444]",
  open:        "bg-[#052E16] text-[#22C55E]",
  direct:      "bg-[#0C1929] text-[#60A5FA]",
  trial:       "bg-[#1C1400] text-[#D4A843]",
  "active-sub":"bg-[#052E16] text-[#22C55E]",
  expired:     "bg-[#1E1E1E] text-[#444444]",
};

const dots: Record<BadgeVariant, string | null> = {
  live:        "#22C55E",
  draft:       null,
  progress:    "#F59E0B",
  delivered:   "#22C55E",
  selected:    "#60A5FA",
  qualified:   "#22C55E",
  pending:     "#F59E0B",
  disputed:    "#EF4444",
  cancelled:   null,
  open:        "#22C55E",
  direct:      "#60A5FA",
  trial:       "#D4A843",
  "active-sub":"#22C55E",
  expired:     null,
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = "draft", children, dot = true, className }: BadgeProps) {
  const dotColor = dots[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5",
        "rounded-full text-xs font-semibold whitespace-nowrap",
        styles[variant],
        className
      )}
    >
      {dot && dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </span>
  );
}
