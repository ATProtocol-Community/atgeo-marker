import { defineConfig } from "@tanstack/react-start/config";
import path from "path";
import tsConfigPaths from "vite-tsconfig-paths";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  tsr: {
    appDirectory: "./src",
  },
  server: {
    preset: "node-server",
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
    resolve: {
      alias: {
        "~/generated": path.resolve(__dirname, "generated"),
        "~/lexicons": path.resolve(__dirname, "lexicons"),
        "~": path.resolve(__dirname, "src"),
      },
    },
  },
});
