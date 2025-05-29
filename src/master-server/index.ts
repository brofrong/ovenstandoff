import { z } from 'zod';
import type { State } from '../state-manager/states';
import {message, close, open, sendMessageToClient} from './master-ws';

export const openConnections: Set<Bun.ServerWebSocket<unknown>> = new Set();
export let runners: {name: string, ws: Bun.ServerWebSocket<unknown>, state: State  }[] = [];

export function setRunners(newRunners: {name: string, ws: Bun.ServerWebSocket<unknown>, state: State  }[]) {
  runners = newRunners;
}

const server = Bun.serve({
  port: 3000,
  fetch: async (req, server) => {
    const url = new URL(req.url);
    
    if (url.pathname === '/') {
      return new Response('hello world');
    }

    if(url.pathname === '/start-match') {
      return startMatch(req);
    }

    if (url.pathname === '/ws') {
      if (server.upgrade(req)) {
        return;
      }
      return new Response('Upgrade failed', { status: 500 });
    }

    return new Response('Not found', { status: 404 });
  },
  websocket: {
    open: open,
    message: message,
    close: close,
  }
});

console.log(`WebSocket server listening on port ${server.port}`);


const reqMatchStartSchema = z.object({
  teams: z.object({
    ct: z.array(z.string()),
    t: z.array(z.string()),
  }),
});

async function startMatch(req: Request) {
  const body = await req.json();
  const parsedBody = reqMatchStartSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response('Invalid request', {status: 400});
  }

  const {teams} = parsedBody.data;

  const freeManager = Object.values(runners).find(it => it.state === "readyForCreateLobby");
  if (!freeManager) {
      return new Response('No free manager', {status: 400});
  }
  freeManager.state = 'createLobby';
  sendMessageToClient(freeManager.ws, {
      type: 'startMatch',
      data: {teams, runner: freeManager.name},
  });

  return new Response('Match started', {status: 200});
}
