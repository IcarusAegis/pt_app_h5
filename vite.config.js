import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

function readQuery(req) {
  return new URL(req.url || '/', 'http://localhost').searchParams;
}

function fetchCabinetQrFromWs({ action, boardId, cabinetId }) {
  return new Promise((resolve, reject) => {
    const sessionId = `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ws = new WebSocket(`wss://www.ptyec.com/ws/cabinet-h5/${encodeURIComponent(sessionId)}`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('后端二维码获取超时'));
    }, 8000);

    function send(type) {
      ws.send(JSON.stringify({
        type,
        action,
        qrBaseUrl: '',
        boardId,
        cabinetId,
      }));
    }

    ws.onopen = () => {
      send('subscribeCabinetQr');
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data || ''));
        if (message.type === 'connected') {
          send('refreshCabinetQr');
          return;
        }
        if (message.type === 'nonce.refresh') {
          clearTimeout(timer);
          ws.close();
          resolve(message);
        }
      } catch (error) {
        clearTimeout(timer);
        ws.close();
        reject(error);
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('后端 WebSocket 连接失败'));
    };
  });
}

function cabinetQrFallbackPlugin() {
  return {
    name: 'cabinet-qr-fallback',
    configureServer(server) {
      server.middlewares.use('/dev/cabinet-qr', async (req, res) => {
        const query = readQuery(req);
        try {
          const message = await fetchCabinetQrFromWs({
            action: query.get('action') === 'return' ? 'return' : 'borrow',
            boardId: query.get('boardId') || '2441',
            cabinetId: query.get('cabinetId') || query.get('boardId') || '2441',
          });
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(message));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            code: 502,
            message: error.message || '后端二维码获取失败',
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('wx-open-'),
        },
      },
    }),
    cabinetQrFallbackPlugin(),
  ],
  server: {
    proxy: {
      '/ws/cabinet-h5': {
        target: 'wss://www.ptyec.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
