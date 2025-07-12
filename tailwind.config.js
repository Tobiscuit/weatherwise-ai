const designSystem = require('./design-system.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,njk,html}"],
  theme: {
    extend: {
      colors: designSystem.colors,
      spacing: designSystem.spacing,
      fontFamily: designSystem.fontFamily,
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
