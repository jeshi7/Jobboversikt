import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F8",
        surface: "#FFFFFF",
        borderSoft: "#D2D6DA",
        accent: "#0056B4",
        accentMuted: "#CCE1F3"
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      },
      boxShadow: {
        subtle: "0 18px 40px rgba(15, 23, 42, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;


