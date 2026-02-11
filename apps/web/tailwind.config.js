/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#0b1118',
        panel: '#0f172a',
        surface: '#111827',
        accent: '#0ea5e9'
      }
    },
  },
  plugins: [],
};
