/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base: "hsl(0 0% 9%)",
        "base-warm": "hsl(0 5% 8%)",
        // Keep in sync with lib/theme/colors.ts
        primary: "hsl(0 72% 52%)",
        "primary-muted": "hsl(0 50% 40%)",
        cancel: "hsl(0 72.2% 50.6%)",
        approve: "hsl(142.1 76.2% 36.3%)",
        pending: "hsl(43.3 96.4% 56.3%)",
        other: "hsl(221.2 83.2% 53.3%)",
      },
      fontFamily: {
        sans: ["Urbanist_400Regular"],
        "sans-medium": ["Urbanist_500Medium"],
        "sans-semibold": ["Urbanist_600SemiBold"],
        "indie-flower": ["IndieFlower_400Regular"],
      },
    },
  },
  plugins: [],
};
