import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#081019",
        panel: "#0e1824",
        line: "#1f3042",
        accent: {
          50: "#e6f4ff",
          100: "#b9e2ff",
          200: "#87cbff",
          300: "#4caeff",
          400: "#2395ff",
          500: "#0d7ef2",
          600: "#005fd1"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(80,160,255,0.14), 0 16px 45px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        "radar-grid":
          "radial-gradient(circle at center, rgba(77,166,255,0.18) 0, rgba(77,166,255,0.08) 18%, transparent 18.5%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
