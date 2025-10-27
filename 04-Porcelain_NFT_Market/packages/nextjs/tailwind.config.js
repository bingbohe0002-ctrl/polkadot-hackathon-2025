/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#4A6572",            // 更深的蓝灰色
          "primary-content": "#FFFFFF",   // 白色文字
          secondary: "#8D6E63",          // 更深的棕灰色
          "secondary-content": "#FFFFFF", // 白色文字
          accent: "#FF9800",             // 更亮的橙色
          "accent-content": "#000000",   // 黑色文字
          neutral: "#F8F9FA",            // 浅白
          "neutral-content": "#4A5568",  // 深蓝灰
          "base-100": "#FFFFFF",         // 白色
          "base-200": "#F4F4F4",         // 浅灰
          "base-300": "#E0E5EC",         // 浅灰蓝
          "base-content": "#2D3748",     // 深蓝灰，更暗以提高对比度
          info: "#3498DB",               // 蓝色
          success: "#2ECC71",            // 绿色
          warning: "#F1C40F",            // 黄色
          error: "#E74C3C",              // 红色
        }
        
      },
      {
        dark: {
          primary: "#7FB3D5",            // 亮蓝色
          "primary-content": "#FFFFFF",   // 白色文字
          secondary: "#D2B48C",          // 棕褐色
          "secondary-content": "#FFFFFF", // 白色文字
          accent: "#FFA726",             // 橙色
          "accent-content": "#FFFFFF",   // 白色文字
          neutral: "#121212",            // 黑色
          "neutral-content": "#F0F0F0",  // 浅白
          "base-100": "#1A1A1A",         // 深黑
          "base-200": "#242424",         // 深灰
          "base-300": "#2C2C2C",         // 深灰黑
          "base-content": "#F5F5F5",     // 更亮的白色
          info: "#3498DB",               // 蓝色
          success: "#27AE60",            // 绿色
          warning: "#F39C12",            // 黄色
          error: "#E74C3C",              // 红色
        }
        
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      zIndex: {
        '-1': '-1',
        '0': '0',
        '1': '1',
        '2': '2',
      },
      backgroundColor: {
        'transparent': 'transparent',
      }
    },
  },
};
