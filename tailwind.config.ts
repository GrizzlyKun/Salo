import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDF8F3',
        coral: {
          DEFAULT: '#FF7A6B',
          soft: '#FFB4A9',
          deep: '#E85C4A',
        },
        turquoise: {
          DEFAULT: '#3EC6C9',
          soft: '#9EE5E6',
          deep: '#2A9A9D',
        },
        honey: {
          DEFAULT: '#FFC94D',
          soft: '#FFE29E',
          deep: '#E8A92E',
        },
        ink: '#3B3A4A',
      },
      fontFamily: {
        display: ['Nunito', 'Quicksand', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 6px 20px -6px rgba(59, 58, 74, 0.18)',
        pop: '0 10px 30px -8px rgba(255, 122, 107, 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
