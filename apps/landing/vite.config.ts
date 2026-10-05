import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// strictPort keeps the landing page on :5174 so the links other apps print stay valid.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
});
