import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        xs: ["0.75rem", "1rem"],
        sm: ["0.875rem", "1.25rem"],
        base: ["1rem", "1.5rem"],
        lg: ["1.111rem", "1.75rem"],
        xl: ["1.333rem", "2rem"],
        "2xl": ["1.556rem", "2.25rem"],
        "3xl": ["1.778rem", "2.5rem"],
        "4xl": ["2rem", "2.75rem"],
        "5xl": ["2.667rem", "3rem"],
      },
      fontFamily: {
        sans: ["var(--font-source-sans)"],
      },
      colors: {
        primary: {
          DEFAULT: "#3d405b",
          hover: "#3d405b/90",
        },
        category: {
          pink: "#ff5ce0",
          orange: "#ffa15c",
          green: "#1dd05b",
          blue: "#5cc8ff",
          red: "#ff625c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
