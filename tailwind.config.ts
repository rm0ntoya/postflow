import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          "surface-2": "var(--bg-surface-2)",
          "surface-3": "var(--bg-surface-3)",
          overlay: "var(--bg-overlay)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          pressed: "var(--accent-pressed)",
          muted: "var(--accent-muted)",
          glow: "var(--accent-glow)",
        },
        state: {
          success: "var(--state-success)",
          warning: "var(--state-warning)",
          danger: "var(--state-danger)",
        },
      },
      spacing: {
        1: "var(--space-1)", 2: "var(--space-2)", 3: "var(--space-3)",
        4: "var(--space-4)", 5: "var(--space-5)", 6: "var(--space-6)",
        8: "var(--space-8)", 10: "var(--space-10)", 12: "var(--space-12)",
        16: "var(--space-16)", 20: "var(--space-20)", 24: "var(--space-24)",
      },
      borderRadius: {
        xs: "var(--radius-xs)", sm: "var(--radius-sm)", md: "var(--radius-md)",
        lg: "var(--radius-lg)", xl: "var(--radius-xl)", pill: "var(--radius-pill)",
      },
      boxShadow: {
        pop: "var(--shadow-pop)",
      },
      transitionTimingFunction: {
        "out-custom": "var(--ease-out)",
        "in-custom":  "var(--ease-in)",
        spring:       "var(--ease-spring)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "280ms",
        page: "420ms",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
