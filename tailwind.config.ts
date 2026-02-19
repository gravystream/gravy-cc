import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Gravy Design System ────────────────────────────────
        gravy: {
          black:   "#000000",
          white:   "#FFFFFF",
          gold:    "#D4A843",  // brand accent
          "gold-dim": "#8A6B27",
          950:     "#0A0A0A",  // page bg
          900:     "#111111",
          800:     "#1E1E1E",
          700:     "#2D2D2D",
          600:     "#444444",
          400:     "#808080",
          200:     "#C7C7C7",
          100:     "#E5E5E5",
        },
        // Functional
        success: {
          DEFAULT: "#22C55E",
          bg:      "#052E16",
          muted:   "#14532D",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg:      "#1C1400",
          muted:   "#451A03",
        },
        danger: {
          DEFAULT: "#EF4444",
          bg:      "#1C0505",
          muted:   "#450A0A",
        },
        info: {
          DEFAULT: "#60A5FA",
          bg:      "#0C1929",
          muted:   "#1E3A5F",
        },
      },
      fontFamily: {
        quicksand: ["Quicksand", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        sans: ["Inter", "Quicksand", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["72px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["56px", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["44px", { lineHeight: "1.1",  letterSpacing: "-0.01em", fontWeight: "700" }],
        "display-sm": ["36px", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "glow-gold": "0 0 40px 0 rgba(212,168,67,0.15)",
        "glow-sm":   "0 0 20px 0 rgba(212,168,67,0.10)",
        "card":      "0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 2px -1px rgba(0,0,0,0.5)",
        "elevated":  "0 4px 24px 0 rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":     "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gravy-hero":         "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,67,0.15) 0%, transparent 60%)",
        "gravy-card":         "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
      },
      animation: {
        "fade-in":     "fadeIn 0.4s ease-out",
        "slide-up":    "slideUp 0.4s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "pulse-gold":  "pulseGold 2s ease-in-out infinite",
        "shimmer":     "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        slideRight:{ from: { transform: "translateX(-16px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        pulseGold: { "0%,100%": { boxShadow: "0 0 0 0 rgba(212,168,67,0.4)" }, "50%": { boxShadow: "0 0 0 8px rgba(212,168,67,0)" } },
        shimmer:   { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
