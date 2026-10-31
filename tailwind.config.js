/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}', // Incluye todos los archivos HTML y TypeScript en src/
    './public/**/*.html',   // Incluye todos los archivos HTML en la carpeta public
  ],
  theme: {
    extend: {
      height: {
        '112': '28rem',
        '128': '32rem',
        '160': '38rem',
      },
      width: {
        '112': '28rem',
        '128': '32rem',
        '160': '38rem',
      },
      colors: {
        primary: {
          50: "oklch(97.07% 0.042 166.18 / <alpha-value>)",
          100: "oklch(94.56% 0.076 165.56 / <alpha-value>)",
          200: "oklch(90.28% 0.146 161.99 / <alpha-value>)",
          300: "oklch(88.01% 0.196 157.49 / <alpha-value>)",
          400: "oklch(83.02% 0.21 153.73 / <alpha-value>)",
          500: "oklch(64.2% 0.162 153.75 / <alpha-value>)",
          600: "oklch(55.06% 0.136 154.67 / <alpha-value>)",
          700: "oklch(44.54% 0.109 155.17 / <alpha-value>)",
          800: "oklch(33.36% 0.08 156.03 / <alpha-value>)",
          900: "oklch(22.62% 0.05 160.88 / <alpha-value>)",
          950: "oklch(14.93% 0.031 165.84 / <alpha-value>)"
        },
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#374151',
          900: '#111827',
        },
        background: {
          dark: '#161618', //18181b
          light: '#f4f4f4',
        },
      }
    },
  },
  plugins: [],
}

