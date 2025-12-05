/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#0A0F0F',
        'fg': '#E6F5F1',
        'neon-green': '#00FF84',
        'cyber-blue': '#00D4FF',
        'warning-orange': '#FF6B35',
        'danger-red': '#FF3366',
      },
      boxShadow: {
        'neumorphic': '20px 20px 60px #070c0c, -20px -20px 60px #0d1212',
        'neumorphic-inset': 'inset 20px 20px 60px #070c0c, inset -20px -20px 60px #0d1212',
      }
    },
  },
  plugins: [],
}
