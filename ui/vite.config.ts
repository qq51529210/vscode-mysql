import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: true,
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        sql: "./src/sql/index.html",
        rows: "./src/rows/index.html",
        docs: "./src/docs/index.html",
        mock: "./src/mock/index.html",
        addTable: "./src/add-table/index.html",
        editTable: "./src/edit-table/index.html",
      },
      output: {
        dir: "../dist/web",
        assetFileNames: "assets/[name][extname]",
        chunkFileNames: "[name].js",
        entryFileNames: "[name].js",
      },
    },
  },
});
