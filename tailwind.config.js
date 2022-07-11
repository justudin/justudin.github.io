module.exports = {
  purge: {
    enabled: true,
    content: ['./src/**/*.html'],
    safelist: [
      'bg-red-800',
      'bg-gray-900',
      'bg-white',
      'text-gray-100',
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
