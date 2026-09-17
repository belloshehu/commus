import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#0B1120',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0284C7',
          foreground: '#FFFFFF',
          hover: '#0369A1',
          light: '#38BDF8',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: '#141E33',
          foreground: 'hsl(var(--card-foreground))',
          border: '#1E293B',
        },
        surface: {
          DEFAULT: '#141E33',
          border: '#1E293B',
          hover: '#1E2D4A',
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
