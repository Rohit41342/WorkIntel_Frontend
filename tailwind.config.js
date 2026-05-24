/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          975: "#050816",
        },
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          200: "#bfd3ff",
          300: "#92b5ff",
          400: "#5f8cff",
          500: "#3b6df4",
          600: "#284fd7",
          700: "#2141ae",
          800: "#22398b",
          900: "#22336f",
        },
      },
      boxShadow: {
        glow: "0 20px 80px rgba(59,109,244,0.2)",
        card: "0 20px 60px rgba(2, 6, 23, 0.3)",
      },
      backgroundImage: {
        "auth-gradient":
          "radial-gradient(circle at top left, rgba(96,165,250,0.18), transparent 36%), radial-gradient(circle at top right, rgba(244,114,182,0.16), transparent 30%), linear-gradient(180deg, rgba(11,15,28,1) 0%, rgba(5,8,22,1) 100%)",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.7 },
          "50%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
