import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.jfif", "**/*.JFIF"],
  envPrefix: ["VITE_", "SUPABASE_", "MS_"],
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
