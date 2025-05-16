import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "unenv";

export default defineConfig({
  tsr: {
    appDirectory: "./src",
  },
  server: {
    preset: "cloudflare-module",
    unenv: cloudflare,
    esbuild: {
      options: {
        supported: {
          "top-level-await": true,
        },
      },
    },
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
    ssr: {
      external: ["node:console"],
    },
  },
});
