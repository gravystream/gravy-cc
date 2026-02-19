"use client";
import React from "react";
import { cn, aiScoreColor, aiScoreLabel } from "@/lib/utils";

interface AIScoreRingProps {
  score: number;  // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizes = {
  sm: { r: 22, stroke: 3,  text: "text-sm",  label: "text-[8px]",  total: 56  },
  md: { r: 30, stroke: 4,  text: "text-base", label: "text-[10px]", total: 72  },
  lg: { r: 40, stroke: 5,  text: "text-xl",  label: "text-xs",     total: 96  },
};

export function AIScoreRing({ score, size = "md", showLabel = true, className }: AIScoreRingProps) {
  const s = sizes[size];
  const circumference = 2 * Math.PI * s.r;
  const offset = circumference - (circumference * score) / 100;
  const color = aiScoreColor(score);
  const label = aiScoreLabel(score);
  const dim = s.total;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Track */}
        <circle
          cx={dim / 2} cy={dim / 2} r={s.r}
          fill="none" stroke="#1E1E1E" strokeWidth={s.stroke}
        />
        {/* Progress */}
        <circle
          cx={dim / 2} cy={dim / 2} r={s.r}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
        {/* Score text */}
        <text
          x={dim / 2} y={dim / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          fill={color}
          className={cn("font-bold font-quicksand", s.text)}
          style={{ fontSize: size === "sm" ? 14 : size === "md" ? 17 : 22, fontFamily: "Quicksand, sans-serif" }}
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className={cn("font-semibold", s.label)} style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
