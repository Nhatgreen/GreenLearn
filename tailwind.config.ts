import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)', 'Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Lora', 'Georgia', 'serif'],
        note: ['var(--font-note)', 'var(--font-ui)', 'cursive', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        desk: {
          surface: "#0c1017",
          border: "#1e2638",
          mat: "#131824",
          wood: "#090d14"
        },
        paper: {
          cream: "#fbf9f4",
          sheet: "#ffffff",
          ink: "#1c1917",
          subtle: "#57534e",
          line: "#e7e5e4"
        },
        vitoken: {
          gold: "#f59e0b",
          glow: "#fbbf24",
          dark: "#78350f"
        },
        hud: {
          bg: "rgba(13, 17, 23, 0.85)",
          border: "rgba(56, 189, 248, 0.25)",
          glow: "rgba(56, 189, 248, 0.2)",
          cyan: "#38bdf8",
          neon: "#00f0ff"
        }
      },
      boxShadow: {
        'paper': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 10px -2px rgba(0, 0, 0, 0.3)',
        'book': '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 8px 20px -4px rgba(0, 0, 0, 0.5)',
        'hud-glow': '0 0 20px rgba(56, 189, 248, 0.3), inset 0 0 15px rgba(56, 189, 248, 0.1)',
        'vitoken-glow': '0 0 25px rgba(245, 158, 11, 0.5)'
      },
      animation: {
        'float-subtle': 'floatSubtle 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      }
    },
  },
  plugins: [],
};
export default config;
