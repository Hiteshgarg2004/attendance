/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",         // your root HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // all files inside src
    "./components/**/*.{js,ts,jsx,tsx}" // if you have a components folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
