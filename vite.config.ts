import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import frappeui from 'frappe-ui/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    frappeui({
      frappeProxy: false,
      jinjaBootData: false,
    }),
    vue(),
    {
      name: 'serve-root-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/index/') || req.url?.startsWith('/apps/')) {
            const filePath = path.join(__dirname, req.url)
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(fs.readFileSync(filePath))
              return
            }
          }
          next()
        })
      }
    }
  ],
  optimizeDeps: {
    include: ['feather-icons', 'debug'],
  },
})
