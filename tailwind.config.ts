import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cedar Cash Home Buyers brand colors
        primary: {
          DEFAULT: "#05622E",
          green: "#05622E",
          logo: "#019342",
          dark: "#044922",
        },
        cedar: {
          green: "#05622E",
          "logo-green": "#019342",
          "dark-green": "#044922",
        },
        text: {
          DEFAULT: "#212529",
          primary: "#212529",
        },
        background: "#FFFFFF",
      },
      fontFamily: {
        // Custom fonts for Cedar Cash Home Buyers
        display: ["Bebas Neue", "sans-serif"], // For headlines/display
        sans: ["Switzer", "system-ui", "sans-serif"], // For body/UI
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
} satisfies Config;