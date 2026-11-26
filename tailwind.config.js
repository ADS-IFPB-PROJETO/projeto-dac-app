/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'orca-bg': '#ECF6F4',
        'orca-primary': '#0F273D',
        'orca-hover': '#1A3B59',
        'orca-warning': '#DDA64B',
        'orca-success': '#2CE078',
        'orca-danger': '#DF4F52',
        'orca-border': '#C6D2D0',
        'orca-muted': '#748598',
        'orca-card': '#FFFFFF',
        'orca-subtle': '#F5FAF9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'orca-sm': '8px',
        'orca-md': '10px',
        'orca-lg': '12px',
      },
    },
  },
  plugins: [],
}
