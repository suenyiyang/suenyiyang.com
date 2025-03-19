import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            a: {
              textDecoration: 'underline',
              '&:hover': {
                opacity: 0.8,
              },
            },
            code: {
              borderRadius: '0.25rem',
              padding: '0.15rem 0.3rem',
              backgroundColor: 'rgba(0,0,0,0.1)',
              fontWeight: '400',
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};
export default config;
