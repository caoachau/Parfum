import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:5000" } },
  build: {
    // De Rollup tu phan tach dependency. Ep React/vendor vao cac chunk rieng
    // tao vong import vendor -> react-vendor -> vendor va lam trang Docker bi trang.
    chunkSizeWarningLimit: 900,
    target: "es2015",
  },
});
