import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0b',
        panel: '#111114',
        edge: '#1f1f24',
        accent: '#ff5a1f',
        accent2: '#22d3ee',
        good: '#22c55e',
        bad: '#ef4444',
      },
      fontFamily: { sans: ['ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
