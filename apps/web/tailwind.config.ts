import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#061A2B",
          slate: "#0D2F45",
          sky: "#4FB7DD",
          amber: "#F7A93B",
          cream: "#FFF4DD"
        }
      },
      boxShadow: {
        glow: "0 20px 70px rgba(79, 183, 221, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
