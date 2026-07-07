import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const proxyTarget = env.API_PROXY_TARGET;

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0", // needed for container access
      port: 5173,
      watch: {
        usePolling: true, // ensures file changes in container mount are detected
        interval: 100, // polling interval (ms)
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
