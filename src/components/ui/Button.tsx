"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "destructive" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
};

const variants = {
  primary:     "bg-white text-black hover:bg-[#C7C7C7]",
  secondary:   "bg-transparent text-white border border-white hover:bg-white hover:text-black",
  ghost:       "bg-transparent text-[#808080] hover:text-white hover:bg-[#1E1E1E]",
  gold:        "bg-[#D4A843] text-black hover:bg-[#E8BF58] shadow-glow-sm",
  destructive: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
  outline:     "bg-transparent text-white border border-[#2D2D2D] hover:border-[#444444]",
};

const sizes = {
  xs: "px-3 py-1.5 text-xs rounded-full gap-1",
  sm: "px-4 py-2   text-xs rounded-full gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-full gap-2",
  lg: "px-7 py-3.5 text-base rounded-full gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-200 cursor-pointer whitespace-nowrap",
        "active:scale-[0.98]",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
