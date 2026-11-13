import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        research: {
          blue: "#1963B5",
          orange: "#D74714",
          teal: "#008391",
          violet: "#8425A5",
          pink: "#B62F67",
          text: "#161616",
          surface: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
export default config;

