import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  root: "src/client",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  plugins: [
    react(),
    cloudflare({
      configPath: "../../wrangler.jsonc",
      inspectorPort: false,
      persistState: { path: "../../.wrangler/state" },
    }),
  ],
});
