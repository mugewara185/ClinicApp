import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleNodeHttpRequest,
  type NodeRequestLike,
  type NodeResponseLike,
  type ServerEnvConfig,
} from './src/server/whatsappNotification';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mounts the server-side /api/booking/whatsapp endpoint in Vite's local dev and preview servers
 * so local development executes the real Node.js backend handler without exposing secrets to the browser.
 */
const clinicWhatsAppServerPlugin = (loadedEnv: Record<string, string>): Plugin => {
  const attachMiddleware = (middlewares: {
    use: (
      route: string,
      fn: (req: NodeRequestLike, res: NodeResponseLike, next: () => void) => void
    ) => void;
  }) => {
    middlewares.use('/api/booking/whatsapp', (req, res) => {
      const mergedEnv: ServerEnvConfig = {
        ...loadedEnv,
        ...(process.env as Record<string, string | undefined>),
      };

      void handleNodeHttpRequest(req, res, {
        env: mergedEnv,
        onLog: ({ level, event, meta }) => {
          const logFn =
            level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
          logFn(`[${event}]`, JSON.stringify(meta));
        },
      });
    });
  };

  return {
    name: 'clinic-whatsapp-server-endpoint',
    configureServer(server) {
      attachMiddleware(server.middlewares as unknown as Parameters<typeof attachMiddleware>[0]);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares as unknown as Parameters<typeof attachMiddleware>[0]);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  // Bridge only the non-sensitive boolean mode flags to client code;
  // CALLMEBOT_APIKEY and CALLMEBOT_PHONE remain strictly server-only.
  const whatsappEnabledFlag =
    env.WHATSAPP_ENABLED ?? env.VITE_WHATSAPP_ENABLED ?? 'false';
  const mockBookingFlag =
    env.MOCK_BOOKING ?? env.VITE_MOCK_BOOKING ?? '';

  return {
    plugins: [react(), clinicWhatsAppServerPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_WHATSAPP_ENABLED': JSON.stringify(whatsappEnabledFlag),
      'import.meta.env.VITE_MOCK_BOOKING': JSON.stringify(mockBookingFlag),
    },
    build: {
      sourcemap: true,
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
