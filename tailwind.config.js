/** @type {import('tailwindcss').Config} */
// terry uses a warm, friendly theme - easy on the eyes
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        terry: {
          bg: '#faf7f5',
          surface: '#ffffff',
          border: '#e8e2dd',
          accent: '#e85d04',
          'accent-dark': '#dc2f02',
          success: '#40916c',
          warning: '#f77f00',
          error: '#d00000',
          text: '#2b2d42',
          muted: '#8d99ae',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

