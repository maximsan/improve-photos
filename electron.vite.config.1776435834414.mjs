// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// package.json
var version = "0.1.0";

// electron.vite.config.ts
var electron_vite_config_default = defineConfig({
  main: {
    resolve: {
      alias: { "@shared": resolve("src/shared") }
    }
  },
  preload: {
    resolve: {
      alias: { "@shared": resolve("src/shared") }
    }
  },
  renderer: {
    define: {
      __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared")
      }
    },
    plugins: [react(), tailwindcss()]
  }
});
export {
  electron_vite_config_default as default
};
