/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'light': ['system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        'light': '300',
      },
      borderRadius: {
        'none': '0',
      },
    },
  },
  plugins: [],
};