import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/mobx-state-machine-router/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["mobx", "mobx-react-lite"],
  },
  optimizeDeps: {
    include: [
      "@mobx-state-machine-router/core",
      "@mobx-state-machine-router/url-persistence",
      "mobx",
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
