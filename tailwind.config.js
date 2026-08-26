/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        line: "var(--line)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        gold: "var(--gold)",
        green: "var(--green)",
        teal: "var(--teal)",
        red: "var(--red)",
        warn: "var(--warn)",
        shell: "var(--shell)",
        sand: "var(--sand)",
        clay: "var(--clay)",
        sea: "var(--sea)",
      },
      boxShadow: {
        ms: "var(--shadow)",
      },
      borderRadius: {
        ms: "var(--r)",
      },
      fontFamily: {
        sans: "var(--sans)",
        serif: "var(--serif)",
      },
      maxWidth: {
        ms: "var(--max)",
      },
    },
  },
  plugins: [],
};
