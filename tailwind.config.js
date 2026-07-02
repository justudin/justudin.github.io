module.exports = {
  purge: {
    enabled: true,
    content: ['./src/**/*.html'],
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        primary: {
          50: '#EAF0FB',
          100: '#CFDEF5',
          200: '#9FBDEB',
          300: '#6F9BE0',
          400: '#3F7AD6',
          500: '#0047BB',
          600: '#003C9E',
          700: '#003080',
          800: '#002563',
          900: '#001945',
          DEFAULT: '#0047BB',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
