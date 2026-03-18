/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Define custom colors if needed
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
      },
    },
  },
  plugins: [],
  safelist: [
    // Safelist for dynamic theme colors
    { pattern: /bg-(blue|green|purple|red|orange|indigo|pink|gray)-(500|600|700|800|900)/ },
    { pattern: /text-(blue|green|purple|red|orange|indigo|pink|gray)-(500|600|700|800|900)/ },
    { pattern: /border-(blue|green|purple|red|orange|indigo|pink|gray)-(500|600|700|800|900)/ },
    { pattern: /ring-(blue|green|purple|red|orange|indigo|pink|gray)-(500|600|700|800|900)/ },
  ],
}

