import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true, host: "localhost", watch: { ignored: ["**/src-tauri/**"] } },
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
  build: {
    target: "chrome105",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        floating: resolve(__dirname, "floating.html"),
      },
    },
  },
});
