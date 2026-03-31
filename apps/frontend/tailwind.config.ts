import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--tg-theme-bg-color, hsl(var(--background)))',
        foreground: 'var(--tg-theme-text-color, hsl(var(--foreground)))',
        primary: {
          DEFAULT: 'var(--tg-theme-button-color, hsl(var(--primary)))',
          foreground: 'var(--tg-theme-button-text-color, hsl(var(--primary-foreground)))',
        },
        secondary: {
          DEFAULT: 'var(--tg-theme-secondary-bg-color, hsl(var(--secondary)))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        card: {
          DEFAULT: 'var(--tg-theme-secondary-bg-color, hsl(var(--card)))',
          foreground: 'var(--tg-theme-text-color, hsl(var(--card-foreground)))',
        },
        hint: 'var(--tg-theme-hint-color, hsl(var(--muted-foreground)))',
        link: 'var(--tg-theme-link-color, hsl(var(--primary)))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
