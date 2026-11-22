import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: "android-wallpapers",
    enforce: "pre",
    resolveId(source) {
      if (mode !== "android") return;
      const theme = source.match(/themes\/([^/]+)\/assets\/wallpaper\.webp\?url$/)?.[1];
      if (theme) return resolve(__dirname, "src-tauri/gen/android/app/src/main/assets/widgets", theme + ".webp") + "?url";
    },
  }],
  publicDir: (mode === "android" || mode === "ios") ? false : "public",
  clearScreen: false,
  server: { port: 1420, strictPort: true, host: "localhost", watch: { ignored: ["**/src-tauri/**"] } },
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
  build: {
    outDir: mode === "ios" ? "dist-ios" : mode === "android" ? "dist-mobile" : "dist",
    target: mode === "ios" ? "safari17" : "chrome105",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      input: (mode === "android" || mode === "ios") ? resolve(__dirname, "mobile.html") : {
        main: resolve(__dirname, "index.html"),
        floating: resolve(__dirname, "floating.html"),
      },
    },
  },
}));
