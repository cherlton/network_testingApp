/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBlue: "#1E3A8A",  // Dark blue
        customGray: "#6B7280", // Gray
        white: "#FFFFFF",      // White
      },
    },
  },
  plugins: [],
};
