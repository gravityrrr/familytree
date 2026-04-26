import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tree: {
          'blue-bg': '#E6F1FB',
          'blue-fg': '#0C447C',
          'blue-ring': '#378ADD',
          'purple-bg': '#EEEDFE',
          'purple-fg': '#3C3489',
          'purple-ring': '#7F77DD',
          'pink-bg': '#FBEAF0',
          'pink-fg': '#72243E',
          'pink-ring': '#D4537E',
          'green-bg': '#E1F5EE',
          'green-fg': '#085041',
          'green-ring': '#1D9E75',
          'amber-bg': '#FAEEDA',
          'amber-fg': '#633806',
          'amber-ring': '#BA7517',
        },
        brand: '#185FA5',
      },
      borderRadius: {
        card: '12px',
        sheet: '20px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
