import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "conifer",
  version: "1.0.0",
  action: { default_popup: "index.html" },
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [{ js: ["src/main.tsx"], matches: ["https://*/*"] }],
  permissions: ["contextMenus"]
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
    }),
    crx({
      manifest,
    }),
  ],
});
