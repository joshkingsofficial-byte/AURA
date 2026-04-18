/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        mirrorBg: '#050509',
      },
      boxShadow: {
        'soft-glow': '0 0 60px rgba(80, 200, 255, 0.7)',
      },
    },
  },
  plugins: [],
}
