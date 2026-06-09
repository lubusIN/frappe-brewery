import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import frappeui from 'frappe-ui/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    frappeui({
      frappeProxy: false,
      jinjaBootData: false,
    }),
    vue(),
  ],
  optimizeDeps: {
    include: ['feather-icons', 'debug'],
  },
})
