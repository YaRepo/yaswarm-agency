import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3001,
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:3002",
      "/ws/terminal": {
        target: "ws://localhost:3002",
        ws: true,
      },
      "/ws": {
        target: "ws://localhost:3002",
        ws: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router-dom/")
          ) {
            return "react-vendor";
          }

          if (id.includes("/@tanstack/react-query/") || id.includes("/zustand/")) {
            return "state-vendor";
          }

          if (id.includes("/recharts/") || id.includes("/d3-")) {
            return "charts-vendor";
          }

          if (
            id.includes("/react-markdown/") ||
            id.includes("/react-syntax-highlighter/")
          ) {
            return "markdown-vendor";
          }

          if (id.includes("/@xterm/")) {
            return "terminal-vendor";
          }

          if (id.includes("/@xenova/transformers/")) {
            return "ai-vendor";
          }
        },
      },
    },
  },
});
