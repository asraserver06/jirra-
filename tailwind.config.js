/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlassian: {
          blue: '#0052CC',
          navy: '#0747A6',
          darkNav: '#172B4D',
          bg: '#F4F5F7',
          column: '#EBECF0',
          border: '#DFE1E6',
          text: '#172B4D',
          subtle: '#5E6C84',
          hover: '#DEEBFF',
          high: '#DE350B',
          urgent: '#6554C0',
          medium: '#FF9900',
          low: '#36B37E',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Noto Sans', 'Ubuntu', 'sans-serif'],
        mono: ['SFMono-Medium', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        jira: '0 1px 2px rgba(9, 30, 66, 0.25)',
        'jira-hover': '0 4px 8px -2px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
        'jira-modal': '0 20px 32px -8px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
      }
    },
  },
  plugins: [],
}
