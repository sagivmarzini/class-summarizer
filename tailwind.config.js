/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        main: "var(--main-color)",
        accent: "var(--accent-color)",
        paper: "var(--paper-color)",
        textColor: "var(--text-color)",
        lightGray: "var(--light-gray)",
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
