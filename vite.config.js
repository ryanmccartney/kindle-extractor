import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from "./package.json";

export default defineConfig({
  base: "/kindle-extractor",
  plugins: [react()],
  define: {
    __VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __HASH__: JSON.stringify((process.env.GIT_COMMIT || "dev").substring(0, 7)),
  },
})
