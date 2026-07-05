/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/client/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      // Palette lifted from igniummotorsports.pages.dev (dark navy + cyan/purple racing theme).
      colors: {
        ignium: {
          bg: "#05070a",
          panel: "#0b111c",
          panel2: "#0f1826",
          border: "rgba(255,255,255,0.08)",
          borderStrong: "rgba(255,255,255,0.14)",
          accent: "#00b8f8",
          accentDim: "#0a3f56",
          purple: "#7e14ff",
          purpleLight: "#863bff",
          blue: "#47bfff",
          text: "#f7fafc",
          muted: "#9aa4af",
          mutedLight: "#d8dce2",
          success: "#22d38a",
          danger: "#ff5c7a",
          warning: "#ffcc66",
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
