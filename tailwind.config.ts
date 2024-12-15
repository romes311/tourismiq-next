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
