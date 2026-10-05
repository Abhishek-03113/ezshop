import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The dev server proxies /api to the Hono API, so the browser sees one origin and needs no CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": process.env.EZSHOP_API_URL ?? "http://localhost:8787" },
  },
});
