// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   // NOTE: Update this to include the paths to all files that contain Nativewind classes.
//   content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
//   presets: [require("nativewind/preset")],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./App.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};