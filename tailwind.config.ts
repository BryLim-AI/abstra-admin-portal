import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        customBlue: "#1c638b",
      },
      backgroundImage: {
        "hero-pattern": "url('/images/hero-section.jpeg')",
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite ease-in-out',
        'wiggle': 'wiggle 0.6s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
