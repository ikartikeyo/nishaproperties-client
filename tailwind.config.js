/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        property: "#2c3e50",
        primary: "#3498db",
        secondary: "#2ecc71",
        accent: "#e74c3c",
        info: "#3498db",
        warning: "#f39c12",
        error: "#e74c3c",
        success: "#2ecc71",
      },
    },
  },
  plugins: [],
}