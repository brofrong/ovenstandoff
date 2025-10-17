import { env } from "./utils/env";
import { guard } from "./utils/guard";
import { close, message, open } from "./master-ws";
import { log } from './utils/log';

const server = Bun.serve({
  port: env.WS_PORT,
  fetch: async (req, server) => {
    const url = new URL(req.url);
    if (!guard(req)) {
      console.log(`Unauthorized request ${req.url}`);
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/ws") {
      if (server.upgrade(req, { data: {} })) {
        return;
      }
      return new Response("Upgrade failed", { status: 500 });
    }

    return new Response("Not found", { status: 404 });
  },

  websocket: {
    open: open,
    message: message,
    close: close,
  },
});

log.info(`WebSocket server listening on port ${server.port}`);

// Глобальный обработчик необработанных ошибок
process.on('uncaughtException', (error) => {
  log.error({ error }, 'Uncaught Exception');
});

process.on('unhandledRejection', (reason, promise) => {
  log.error({ reason, promise }, 'Unhandled Rejection');
});
