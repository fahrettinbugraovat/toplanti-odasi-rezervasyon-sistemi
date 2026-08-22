import type { Config } from "tailwindcss";

const config: Config = {
  // SADECE BU SATIRI EKLİYORSUN (Tasarımı bozmaz, sadece dark mod kilidini açar)
  darkMode: 'class', 
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... diğer ayarların (hiçbirine dokunma)
};
export default config;