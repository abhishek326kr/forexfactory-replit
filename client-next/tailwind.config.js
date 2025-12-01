/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#0A84FF",
          dark: "#0060DF",
          light: "#9ED0FF",
        },
        surface: {
          50: "#0B0D16",
          100: "#121527",
          200: "#1B2040",
          300: "#232A58",
        },
      },
    },
  },
  plugins: [],
};

