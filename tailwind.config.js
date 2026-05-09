/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#003366', // Deep Blue
          secondary: '#C0C0C0', // Silver
          success: '#00CC66', // Light Green
          warning: '#FF3333', // Red
          bg: '#0a0c16', // Deep background
          ai: '#8b5cf6', // AI purple
          text: '#f1f5f9', // Light text
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
