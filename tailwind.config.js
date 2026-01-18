/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Endfield theme colors
        endfield: {
          yellow: '#F5C518',
          'yellow-dark': '#D4A917',
          'yellow-light': '#FFD93D',
          black: '#0A0A0A',
          'dark-gray': '#1A1A1A',
          'mid-gray': '#2A2A2A',
          'light-gray': '#3A3A3A',
          'off-white': '#F5F5F5',
          'muted': '#888888',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245, 197, 24, 0.3)',
        'glow-sm': '0 0 10px rgba(245, 197, 24, 0.2)',
      },
    },
  },
  plugins: [],
};
