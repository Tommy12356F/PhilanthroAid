/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#231C1A",     // main dark background
          papaya: "#FFEFD5",  // papaya whip for hover
        },
      },
      fontFamily: {
        italiana: ["Italiana", "serif"],
        bricolage: ["Bricolage Grotesque", "sans-serif"],
        prompt: ["Prompt", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(180deg, rgba(35,28,26,0.8) 0%, rgba(35,28,26,0.9) 100%)",
      },
    },
  },
  plugins: [],
}
