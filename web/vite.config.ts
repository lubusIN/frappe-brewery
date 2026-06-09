import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // In development, the registry index/ files need to be accessible.
  // Run `npm run generate:index` from repo root first, then symlink or
  // set VITE_REGISTRY_BASE to point to a local server serving them.
  // In production (Cloudflare Pages), the static files are co-deployed.
})
