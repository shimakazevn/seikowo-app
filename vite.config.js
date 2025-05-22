import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 80,
    historyApiFallback: true
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
});
