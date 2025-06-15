import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { atomProxyPlugin } from './vite-proxy-plugin.js';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [react(), atomProxyPlugin(),  cssInjectedByJsPlugin(), ],
  base: '/',
  server: {
    port: 80,
    host: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    },
    fs: {
      strict: false,
      allow: ['..']
    },
    proxy: {
      '/api/blogger': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => {
          try {
            const url = new URL(decodeURIComponent(path.replace('/api/blogger?url=', '')));
            const newPath = url.pathname;
            console.log('Rewriting path:', path, 'to:', newPath + url.search);
            return newPath + url.search;
          } catch (error) {
            console.error('Error rewriting path:', error);
            return path;
          }
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', {
              method: req.method,
              originalUrl: req.url,
              targetUrl: proxyReq.path
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', {
              statusCode: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            });
          });
        },
      },
      '/api/blogger-json': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => {
          try {
            const url = new URL(decodeURIComponent(path.replace('/api/blogger-json?url=', '')));
            const newPath = url.pathname.startsWith('/blogger/v3') ? url.pathname : `/blogger/v3${url.pathname}`;
            console.log('Rewriting path:', path, 'to:', newPath + url.search);
            return newPath + url.search;
          } catch (error) {
            console.error('Error rewriting path:', error);
            return path;
          }
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', {
              method: req.method,
              originalUrl: req.url,
              targetUrl: proxyReq.path
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', {
              statusCode: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            });
          });
        },
      },
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@chakra-ui/react',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: '',
    sourcemap: false,
    minify: 'terser',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 500000,
    emptyOutDir: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        dead_code: true,
        toplevel: true
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      input: {
        app: './src/main.tsx'
      },
      output: {
        entryFileNames: `index.[hash].js`,
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});