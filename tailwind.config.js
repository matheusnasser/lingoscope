/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        deepTeal: {
          DEFAULT: '#0F4C5C',
          light: '#165F70',
        },
        vibrantCoral: {
          DEFAULT: '#FF6B58',
          light: '#FF8273',
        },
        nightshade: '#1A1A2E',
        offWhite: '#F8F9FA',
        coolGray: '#9BA4B5',
      },
    },
  },
  plugins: [],
};
