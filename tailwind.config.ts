/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        surface: {
          DEFAULT: '#141E33',
          border: '#1E293B',
          hover: '#1E2D4A',
        },
        primary: {
          DEFAULT: '#0284C7',
          hover: '#0369A1',
          light: '#38BDF8',
        },
        danger: {
          high: {
            bg: '#450A0A',
            border: '#991B1B',
            text: '#FCA5A5',
            badge: '#DC2626',
          },
          medium: {
            bg: '#451A03',
            border: '#7C2D12',
            text: '#FDBA74',
            badge: '#D97706',
          },
          low: {
            bg: '#0C4A6E',
            border: '#075985',
            text: '#7DD3FC',
            badge: '#0284C7',
          },
        },
        verified: {
          bg: '#064E3B',
          border: '#065F46',
          text: '#A7F3D0',
          badge: '#059669',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
