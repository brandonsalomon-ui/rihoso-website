import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#243b53",
          900: "#102a43",
          950: "#0a1929",
        },
        tan: {
          50: "#fdfaf6",
          100: "#f8f1e6",
          200: "#f0e2cc",
          300: "#e5ceaa",
          400: "#d4b48a",
          500: "#c19a6b",
          600: "#a67c52",
          700: "#8a6342",
          800: "#6e4f35",
          900: "#5a3f2b",
        },
        sand: {
          50: "#fefdfb",
          100: "#faf7f2",
          200: "#f5efe5",
          300: "#ede4d4",
          400: "#e0d3be",
          500: "#d1c0a5",
        },
        slate: {
          blue: "#4a6fa5",
        },
      },
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        luxury: "0 4px 40px rgba(16, 42, 67, 0.08)",
        "luxury-lg": "0 8px 60px rgba(16, 42, 67, 0.12)",
        "luxury-xl": "0 16px 80px rgba(16, 42, 67, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
