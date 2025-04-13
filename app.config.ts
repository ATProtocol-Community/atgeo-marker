import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "./src",
  },
  server: {
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
  },
});
