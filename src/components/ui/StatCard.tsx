import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, sub, subColor, icon, trend, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "#22C55E" :
    trend === "down" ? "#EF4444" :
    "#808080";

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[#808080]">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-[#808080]">
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white font-quicksand tracking-tight mb-1">
        {value}
      </div>
      {sub && (
        <div className="text-xs font-medium" style={{ color: subColor || trendColor }}>
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {sub}
        </div>
      )}
    </div>
  );
}
