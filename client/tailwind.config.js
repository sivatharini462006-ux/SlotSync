/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ash & Sea Glass Primary Tokens
        navy: {
          900: '#0F172A', // Slate-Onyx Ground
          800: '#1E293B', // Ash Navigation / Sidebars
          700: '#334155', // Charcoal Secondary Muted
          600: '#475569', // Medium Ash Border-Gray
          100: '#F1F5F9', // Soft Misty Surface Background
          50:  '#F8FAFC', // Ultra-Light Page Slate
        },
        royal: {
          // Sea Glass Accent Suite (Buttons, Call-to-actions)
          500: '#14B8A6', // Bright Jade / Sea Glass Hover
          600: '#0D9488', // Prime Teal Sea Glass
          700: '#0F766E', // Deeper Shadow Teal
          50:  '#F0FDF4', // Emerald Mint Success Tint
        },
        accent: {
          // Dynamic Secondary highlight (Information state)
          cyan: '#06B6D4', // Sea Glass Ocean Cyan
          sage: '#86EFAC', // Natural Muted Mint
        },
        surface: '#FAFBFB', // Smooth White Paper background
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(13, 148, 136, 0.04), 0 4px 20px -2px rgba(15, 23, 42, 0.03)',
        'glow-teal': '0 0 15px rgba(13, 148, 136, 0.15)',
        'card': '0 10px 30px -10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
      },
    },
  },
  plugins: [],
}