import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // needed for container access
    port: 5173,
    watch: {
      usePolling: true, // ensures file changes in container mount are detected
      interval: 100     // polling interval (ms)
    }
  }
})
