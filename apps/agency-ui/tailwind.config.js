/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Aetherium-inspired dark palette with gold/amber accents
        yaswarm: {
          bg: "#0a0a0f",
          surface: "#12121a",
          card: "#1a1a25",
          border: "#2a2a3a",
          hover: "#22223a",
          text: "#e8e8f0",
          muted: "#8888a0",
          accent: "#d4a843",
          "accent-dim": "#9a7a30",
          "accent-glow": "#e8c060",
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
          info: "#60a5fa",
        },
      },
      fontFamily: {
        body: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
