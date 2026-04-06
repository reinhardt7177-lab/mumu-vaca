/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        fairy: {
          cream: "#FFF9ED",
          peach: "#FFD9C2",
          mint: "#D7F6E2",
          sky: "#C9E8FF",
          ink: "#3D3A52"
        }
      },
      boxShadow: {
        fairy: "0 12px 30px rgba(61, 58, 82, 0.12)"
      },
      borderRadius: {
        fairy: "1.25rem"
      }
    }
  },
  plugins: []
};
