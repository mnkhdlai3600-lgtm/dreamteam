import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/background/index.ts"),
      formats: ["iife"],
      name: "BolorBackground",
      fileName: () => "background.js",
    },
  },
});
