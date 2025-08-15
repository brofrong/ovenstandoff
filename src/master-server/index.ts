import { z } from "zod";
import type { State } from "../worker/state-manager/states";
import { message, close, open, sendMessageToClient } from "./master-ws";
import { initDB, handleRegisterClients } from './register-client';
import { guard } from "./guard";
import { env } from "./env";
import { readFileSync } from "fs";
import { join } from "path";
import { reportMatchEnded } from "./ch-server";

export const openConnections: Set<Bun.ServerWebSocket<unknown>> = new Set();
export let runners: {
  name: string;
  ws: Bun.ServerWebSocket<unknown>;
  state: State;
  matchID: string | null;
  callbackUrl: string | null;
}[] = [];

export function setRunners(
  newRunners: { name: string; ws: Bun.ServerWebSocket<unknown>; state: State; matchID: string | null; callbackUrl: string | null }[]
) {
  runners = newRunners;
}

if (env.MOCK) {
  for (let i = 0; i < env.MOCK; i++) {
    runners.push(
      {
        name: `mock-${i}`, ws: {
          send: () => 0,
          close: () => { },
          ping: () => 0,
          pong: () => 0,
          sendText: () => 0,
          sendBinary: () => 0,
          terminate: () => { },
          publish: () => 0,
          publishText: () => 0,
          publishBinary: () => 0,
          subscribe: () => 0,
          unsubscribe: () => 0,
          isSubscribed: () => false,
          cork: (a) => a as any,
          remoteAddress: "127.0.0.1",
          readyState: 1,
          data: null,
          getBufferedAmount: () => 0,
        }, state: "readyForCreateLobby", matchID: null, callbackUrl: null
      },
    );
  }
}

initDB();

const server = Bun.serve({
  port: env.PORT,
  fetch: async (req, server) => {

    const url = new URL(req.url);

    if (url.pathname === "/") {
      try {
        const htmlPath = join(import.meta.dir, "html", "index.html");
        const htmlContent = readFileSync(htmlPath, "utf-8");
        return new Response(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      } catch (error) {
        console.error("Error reading HTML file:", error);
        return new Response("Error loading page", { status: 500 });
      }
    }

    if (!guard(req)) {
      console.log(`Unauthorized request ${req.url}`);
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/start-match") {
      return startMatch(req);
    }

    if (url.pathname === "/register-clients") {
      return handleRegisterClients(req);
    }

    if (url.pathname === "/api/runners") {
      return new Response(JSON.stringify(runners), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (url.pathname === "/api/end-match") {
      return handleEndMatch(req);
    }

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
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

console.log(`WebSocket server listening on port ${server.port}`);

const reqMatchStartSchema = z.object({
  matchID: z.string(),
  map: z.string().optional(),
  callbackUrl: z.string(),
  teams: z.object({
    ct: z.array(z.string()),
    t: z.array(z.string()),
  }),
});

async function startMatch(req: Request) {
  const body = await req.json();
  const parsedBody = reqMatchStartSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response(`Invalid request ${JSON.stringify(parsedBody.error)}`, { status: 400 });
  }

  const { teams } = parsedBody.data;

  const freeManager = Object.values(runners).find(
    (it) => it.state === "readyForCreateLobby"
  );
  if (!freeManager) {
    return new Response("No free manager", { status: 503 });
  }
  freeManager.state = "createLobby";
  freeManager.callbackUrl = parsedBody.data.callbackUrl;
  freeManager.matchID = parsedBody.data.matchID;

  sendMessageToClient(freeManager.ws, {
    type: "startMatch",
    data: { teams, runner: freeManager.name },
  });

  return new Response("Match started", { status: 200 });
}

const endMatchSchema = z.object({
  runner: z.string(),
  winner: z.enum(["ct", "t", "error"]),
});

async function handleEndMatch(req: Request) {
  try {
    const body = await req.json();
    const parsedBody = endMatchSchema.safeParse(body);

    if (!parsedBody.success) {
      return new Response("Invalid request", { status: 400 });
    }

    const { runner: runnerName, winner } = parsedBody.data;

    // Находим runner по имени
    const runner = runners.find(r => r.name === runnerName);
    if (!runner) {
      return new Response("Runner not found", { status: 404 });
    }

    if (!runner.matchID) {
      return new Response("Runner is not in a match", { status: 400 });
    }

    // Отправляем сообщение о завершении матча через WebSocket
    sendMessageToClient(runner.ws, {
      type: "matchEnded",
      data: { winner }
    });

    // Отправляем уведомление через callback URL
    const matchID = runner.matchID;
    const callbackUrl = runner.callbackUrl;

    if (winner === "error") {
      await reportMatchEnded(matchID, null, "Match ended with error", callbackUrl);
    } else {
      await reportMatchEnded(matchID, winner as "ct" | "t", null, callbackUrl);
    }

    // Сбрасываем matchID
    runner.matchID = null;
    runner.callbackUrl = null;
    runner.state = "readyForCreateLobby";

    return new Response("Match ended successfully", { status: 200 });
  } catch (error) {
    console.error("Error ending match:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
