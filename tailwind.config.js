/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/client/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      // Values live as CSS custom properties in src/client/index.css (dark + light blocks) so
      // the theme can be swapped at runtime via a data-theme attribute. RGB-triple variables use
      // Tailwind's rgb(var(--x) / <alpha-value>) pattern so opacity modifiers (e.g. bg-x/15) keep
      // working; border colors are never opacity-modified so they stay as plain rgba() strings.
      colors: {
        ignium: {
          bg: "rgb(var(--ignium-bg) / <alpha-value>)",
          panel: "rgb(var(--ignium-panel) / <alpha-value>)",
          panel2: "rgb(var(--ignium-panel2) / <alpha-value>)",
          border: "var(--ignium-border)",
          borderStrong: "var(--ignium-border-strong)",
          accent: "rgb(var(--ignium-accent) / <alpha-value>)",
          accentDim: "rgb(var(--ignium-accent-dim) / <alpha-value>)",
          purple: "rgb(var(--ignium-purple) / <alpha-value>)",
          purpleLight: "rgb(var(--ignium-purple-light) / <alpha-value>)",
          blue: "rgb(var(--ignium-blue) / <alpha-value>)",
          text: "rgb(var(--ignium-text) / <alpha-value>)",
          muted: "rgb(var(--ignium-muted) / <alpha-value>)",
          mutedLight: "rgb(var(--ignium-muted-light) / <alpha-value>)",
          success: "rgb(var(--ignium-success) / <alpha-value>)",
          danger: "rgb(var(--ignium-danger) / <alpha-value>)",
          warning: "rgb(var(--ignium-warning) / <alpha-value>)",
          onAccent: "rgb(var(--ignium-on-accent) / <alpha-value>)",
          overlay: "rgb(var(--ignium-overlay) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
};
