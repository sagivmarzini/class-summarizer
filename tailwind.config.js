/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3498DB",
        background: "#F5F5F5",
        textColor: "2C3E50",
      },
      fontFamily: {
        rubik: ["Rubik", "sans-serif"],
        "gveret-levin": ["GveretLevin", "sans-serif"],
        yarden: ["Yarden", "sans-serif"],
      },
      boxShadow: {
        button3d: "0 8px",
      },
      backgroundImage: {
        "notebook-lines": "linear-gradient(to bottom, white 29px, #00b0d7 1px)",
      },

      animation: {
        "spin-custom": "spin 1s linear infinite",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        slideIn: {
          from: {
            transform: "translateY(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
};
