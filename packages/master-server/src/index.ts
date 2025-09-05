import Fastify from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { masterContract } from '@ovenstandoff/contract';
import { initDB } from './register-client';
import { env } from './utils/env';
import { startMatchHandler, registerClientsHandler } from './services/match';
import { enableMockWorkers } from './mock';
const app = Fastify();
const s = initServer();


initDB();
enableMockWorkers();

const router = s.router(masterContract, {
  startMatch: async (req) => await startMatchHandler(req),
  registerClients: async (req) => await registerClientsHandler(req),
});


app.register(s.plugin(router));


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
