import Fastify from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { masterContract } from '@ovenstandoff/contract';
import { initDB } from './register-client';
import { env } from './utils/env';
import { startMatchHandler, registerClientsHandler } from './services/match';
import { enableMockWorkers } from './mock';
import path from 'path';
const app = Fastify();
const s = initServer();


initDB();
enableMockWorkers();

const router = s.router(masterContract, {
  startMatch: async (req) => await startMatchHandler(req),
  registerClients: async (req) => await registerClientsHandler(req),
});


app.register(s.plugin(router));

// Настройка статических файлов из front-end/dist
await app.register(import('@fastify/static'), {
  root: path.join(__dirname, '../../front-end/dist'),
  prefix: '/',
});

// Fallback для SPA - все неизвестные маршруты возвращают index.html
app.setNotFoundHandler((request, reply) => {
  // Если это API запрос, возвращаем 404
  if (request.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Not Found' });
    return;
  }

  // Для всех остальных запросов возвращаем index.html (SPA fallback)
  // Используем типизированный sendFile после регистрации @fastify/static
  (reply as any).sendFile('index.html');
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT });
    console.log(`Server is running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
