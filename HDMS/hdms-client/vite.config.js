import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const espTarget = env.VITE_ESP32_URL || 'http://192.168.137.176';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/esp': {
          target: espTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/esp/, '')
        }
      }
    }
  };
});
