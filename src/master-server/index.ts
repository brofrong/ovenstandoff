import type { State } from '../state-manager/states';
import {changeStateSchema, messagesSchema, registerRunnersSchema, type MessageType, type SendMessage} from './messages.schema';

const openConnections: Set<Bun.ServerWebSocket<unknown>> = new Set();

let runners: {name: string, ws: Bun.ServerWebSocket<unknown>, state: State  }[] = [];

setInterval(() => {
  Object.entries(runners).forEach(([runner, { ws, state }]) => {
    console.log(`${Date.now()} ${runner} is ${state}`);
    startMatch();
  });
}, 1000);

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    // Upgrade the request to WebSocket
    if (server.upgrade(req)) {
      return; // Return if upgrade was successful
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      openConnections.add(ws);
    },
    async message(ws, message) {
      console.log("Received:", message);
      // Echo the message back
      const { error } = await processMessage(ws, message.toString());
      if (error) {
        ws.send(JSON.stringify({ error: error }));
      }
    },
    close(ws) {
      console.log("Client disconnected");
        const newRunnersList = runners.filter(it => it.ws !== ws);
        runners = newRunnersList;
        
        openConnections.delete(ws);
    },
  },
});

console.log(`WebSocket server listening on port ${server.port}`);


const messageHandlers: Record<MessageType, (ws: Bun.ServerWebSocket<unknown>, data: unknown) => Promise<{ error: string | null; }>> = {
   registerRunners: async (ws, data) => await handleRegisterRunners(ws, data),
   changeState: async (ws, data) => await handleChangeState(ws, data),
   startMatch: async (ws, data) => {console.log('start match', data); return { error: null }},
}

async function handleRegisterRunners(ws: Bun.ServerWebSocket<unknown>, data: unknown): Promise<{ error: string | null; }> {
    const parsedData = registerRunnersSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.message };
    }
    parsedData.data.runners.forEach(it => {
        runners.push({name: it.runner, ws, state: it.state});
    });
    return { error: null };
}

async function handleChangeState(ws: Bun.ServerWebSocket<unknown>, data: unknown): Promise<{ error: string | null; }> {
    const parsedData = changeStateSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.message };
    }
    const { runner, state } = parsedData.data;
    const runnerToChange = runners.find(it => it.name === runner);
    if (!runnerToChange) {
        return { error: `Runner ${runner} not found` };
    }
    runnerToChange.state = state;
    return { error: null };
}



async function processMessage(ws: Bun.ServerWebSocket<unknown>, message: string): Promise<{ error: string | null; }> {
    const parsedMessage = messagesSchema.safeParse(JSON.parse(message));
    if (!parsedMessage.success) {
        return { error: parsedMessage.error.message };
    }
    return messageHandlers[parsedMessage.data.type](ws, parsedMessage.data.data);
}

export async function sendMessageToClient(ws: Bun.ServerWebSocket<unknown>, message: SendMessage) {
    if (!ws) {
      return console.error('try to send message to client but ws is not connected');   
    }
    ws.send(JSON.stringify(message));
  }


function startMatch() {
    console.log('try to start match');
    const freeManager = Object.values(runners).find(it => it.state === "readyForCreateLobby");
    if (!freeManager) {
        console.log('no free manager');
        return;
    }
    freeManager.state = 'createLobby';
    const teams = {
        ct: ["123456789"],
        t: ["Brofrong"],
    };
    sendMessageToClient(freeManager.ws, {
        type: 'startMatch',
        data: {teams, runner: freeManager.name},
    })
  }
