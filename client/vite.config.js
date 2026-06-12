import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "ec2-65-0-170-113.ap-south-1.compute.amazonaws.com",
    ],
    proxy: {
      "/api": {
        target: "http://discovery-server:5000" || "http://server:5000",
        secure: false,
        changeOrigin: true
      }
    },
    watch: {
      usePolling: true
    }
  }
})

