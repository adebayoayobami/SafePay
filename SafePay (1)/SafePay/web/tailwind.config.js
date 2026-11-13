/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {
    colors: { cream:"#FFF9F0", peach:"#FFDAB9", mint:"#C9F5D9", ink:"#1A1A1A", blush:"#FFB5C2", lilac:"#E8E0FF" },
    borderRadius: { card:"1.5rem" }
  }},
  plugins: [],
}
