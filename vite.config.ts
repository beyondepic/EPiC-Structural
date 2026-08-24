import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  server: {
    // 5177, not 5175: EPiC-Explorer serves on 5175, so the two cannot run
    // side by side. strictPort so a silent fallback cannot recreate the clash.
    port: 5177,
    host: true,
    strictPort: false,
  },
  preview: {
    port: 4175,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          plotly: ["plotly.js", "react-plotly.js"],
          three: ["three"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "plotly.js", "react-plotly.js"],
  },
});
