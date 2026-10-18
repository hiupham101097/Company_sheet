/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        pastel: {
          50: '#F5FAF7',
          100: '#E6F4EE',
          200: '#CEE8DD',
          300: '#A8D7C6',
          400: '#75BFAB',
          500: '#4E9F8E', // Màu chủ đạo xanh pastel
          600: '#3D8274',
          700: '#33695E',
          800: '#2A544C',
          900: '#24453F',
        },
        surface: {
          card: '#FFFFFF',
          bg: '#F8FAF9',
          subtle: '#EFF5F2',
          border: '#E3ECE7',
        }
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(78, 159, 142, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 25px -5px rgba(78, 159, 142, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
