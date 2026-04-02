import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    },
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: '#090909',
        },
        secondary: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--text-secondary)',
        },
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text)',
        },
        accent: 'var(--accent)',
        muted: 'var(--bg-elevated)',
        'muted-foreground': 'var(--text-muted)',
        destructive: 'var(--red)',
        'destructive-foreground': 'var(--text)',
        border: 'var(--border)',
        input: 'var(--bg-input)',
        ring: 'var(--accent)',
        hint: 'var(--text-muted)',
        link: 'var(--accent)',
        income: 'var(--green)',
        expense: 'var(--red)',
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
