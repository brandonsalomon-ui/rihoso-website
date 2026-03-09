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
        forest: {
          50: "#f2f5f2",
          100: "#e0e8e0",
          200: "#b8cdb8",
          300: "#8fb08f",
          400: "#5e8a5e",
          500: "#3d6b3d",
          600: "#2d4f2d",
          700: "#1f3a1f",
          800: "#1a2e1a",
          900: "#0f1d0f",
          950: "#080f08",
        },
        gold: {
          50: "#fdf9ef",
          100: "#f9f0d6",
          200: "#f2dfaa",
          300: "#e8c96e",
          400: "#c9a84c",
          500: "#b8923a",
          600: "#9a742e",
          700: "#7d5a26",
          800: "#674a22",
          900: "#563d1f",
        },
        cream: {
          50: "#fefdfb",
          100: "#f5f0e8",
          200: "#ede5d5",
          300: "#e0d4be",
          400: "#cdbf9f",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Cormorant Garamond", "Garamond", "serif"],
        sans: ["Cormorant Garamond", "Garamond", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
