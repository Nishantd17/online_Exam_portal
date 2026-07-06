/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3B82F6',
          blueDark: '#2563EB',
          blueLight: '#60A5FA',
          violet: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        // Dark theme mappings
        darkBg: '#0F172A',
        darkSurface: '#1E293B',
        darkElevated: '#334155',
        darkText: '#F1F5F9',
        darkMuted: '#94A3B8'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 1px 3px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
