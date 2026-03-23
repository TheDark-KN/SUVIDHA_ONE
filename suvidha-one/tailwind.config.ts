import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/kiosk/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#1A3C8F",
        accent: "#FF6600",
        success: "#217346",
        error: "#C0392B",
        background: "#FFFFFF",
        "background-light": "#F5F5F5",
        "text-primary": "#333333",
        "text-secondary": "#666666",
        "high-contrast-bg": "#000000",
        "high-contrast-text": "#FFFFFF",
      },
      fontFamily: {
        noto: ["Noto Sans", "Noto Sans Devanagari", "Roboto", "Arial", "sans-serif"],
      },
      fontSize: {
        hero: ["72px", { lineHeight: "1.2" }],
        h1: ["60px", { lineHeight: "1.3" }],
        h2: ["48px", { lineHeight: "1.4" }],
        body: ["48px", { lineHeight: "1.5" }],
        button: ["56px", { lineHeight: "1.2" }],
        input: ["48px", { lineHeight: "1.4" }],
        kiosk: ["64px", { lineHeight: "1.1" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "kiosk-sm": "5rem",    // 80px minimum touch target
        "kiosk-md": "7.5rem",  // 120px large touch target
        "kiosk-lg": "10rem",   // 160px xlarge touch target
        "kiosk-xl": "12.5rem", // 200px xxlarge touch target
      },
      minHeight: {
        "screen-kiosk": "100vh",
        "kiosk-touch": "5rem",  // 80px minimum touch target
        "kiosk-large": "7.5rem", // 120px large touch target
      },
      minWidth: {
        "kiosk-touch": "5rem",  // 80px minimum touch target
        "kiosk-large": "7.5rem", // 120px large touch target
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 1.5s ease-in",
        "bounce-slow": "bounce 3s infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "shake": "shake 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-10px)" },
          "75%": { transform: "translateX(10px)" },
        },
      },
      screens: {
        "kiosk": { "raw": "(orientation: landscape)" },
        "tablet": { "min": "768px" },
        "desktop": { "min": "1024px" },
      },
      borderRadius: {
        "kiosk": "1.5rem",
        "kiosk-xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
