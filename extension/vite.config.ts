import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Conifer",
  version: "1.0.0",
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [{ js: ["src/main.tsx"], matches: ["https://*/*"] }],
  permissions: ["contextMenus"],
  action: {
    default_icon: 'favicon.png',
  },
  icons: {
    32: 'favicon.png'
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    crx({ manifest }),
  ],
});
