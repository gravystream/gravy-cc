import React from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  online?: boolean;
  verified?: boolean;
  className?: string;
}

const sizes = {
  xs:  { box: "w-6 h-6 text-[10px]",  dot: "w-2 h-2",   ring: "w-3.5 h-3.5" },
  sm:  { box: "w-8 h-8 text-xs",      dot: "w-2 h-2",   ring: "w-4 h-4"   },
  md:  { box: "w-10 h-10 text-sm",    dot: "w-2.5 h-2.5", ring: "w-5 h-5" },
  lg:  { box: "w-14 h-14 text-base",  dot: "w-3 h-3",   ring: "w-6 h-6"   },
  xl:  { box: "w-20 h-20 text-xl",    dot: "w-4 h-4",   ring: "w-7 h-7"   },
  "2xl": { box: "w-28 h-28 text-3xl", dot: "w-5 h-5",   ring: "w-8 h-8"   },
};

export function Avatar({ name, src, size = "md", online, verified, className }: AvatarProps) {
  const s = sizes[size];
  return (
    <div className={cn("relative inline-flex flex-shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(s.box, "rounded-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            s.box,
            "rounded-full bg-[#2D2D2D] flex items-center justify-center",
            "font-bold text-white"
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span
          className={cn(
            s.dot,
            "absolute bottom-0 right-0 rounded-full bg-[#22C55E]",
            "border-2 border-[#0A0A0A]"
          )}
        />
      )}
      {verified && (
        <span
          className={cn(
            s.ring,
            "absolute -bottom-1 -right-1 rounded-full bg-[#D4A843]",
            "flex items-center justify-center"
          )}
        >
          <svg viewBox="0 0 12 12" fill="none" className="w-2/3 h-2/3">
            <path d="M2 6l2.5 2.5 5.5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </div>
  );
}
