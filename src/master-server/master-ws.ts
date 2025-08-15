import { openConnections, runners } from ".";
import { reportMatchEnded, reportMatchCode } from './ch-server';
import { setRunners } from "./index";
import {
  changeStateSchema,
  lobbyCodeSchema,
  matchEndedSchema,
  messagesClientSchema,
  registerRunnersSchema,
  runnersUpdateSchema,
  type MessageTypeClient,
  type SendMessageFromMaster,
} from "./messages.schema";

export async function message(
  ws: Bun.ServerWebSocket<unknown>,
  message: string | Buffer
) {
  console.log("Received:", message);
  // Echo the message back
  const { error } = await processMessage(ws, message.toString());
  if (error) {
    ws.send(JSON.stringify({ error: error }));
  }
}

export function open(ws: Bun.ServerWebSocket<unknown>) {
  console.log("Client connected");
  openConnections.add(ws);
}

export function close(ws: Bun.ServerWebSocket<unknown>) {
  console.log("Client disconnected");
  const newRunnersList = runners.filter((it) => it.ws !== ws);
  setRunners(newRunnersList);

  openConnections.delete(ws);

  // Уведомляем клиентов об изменении списка runners
  broadcastRunnersUpdate();
}

const messageHandlers: Record<
  MessageTypeClient,
  (
    ws: Bun.ServerWebSocket<unknown>,
    data: unknown
  ) => Promise<{ error: string | null }>
> = {
  registerRunners: async (ws, data) => await handleRegisterRunners(ws, data),
  changeState: async (ws, data) => await handleChangeState(ws, data),
  lobbyCode: async (ws, data) => await handleLobbyCode(ws, data),
  matchEnded: async (ws, data) => await handleMatchEnded(ws, data),
};

async function handleRegisterRunners(
  ws: Bun.ServerWebSocket<unknown>,
  data: unknown
): Promise<{ error: string | null }> {
  const parsedData = registerRunnersSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: parsedData.error.message };
  }
  parsedData.data.runners.forEach((it) => {
    runners.push({ name: it.runner, ws, state: it.state, matchID: null, callbackUrl: null });
  });
  broadcastRunnersUpdate();
  return { error: null };
}

async function handleChangeState(
  ws: Bun.ServerWebSocket<unknown>,
  data: unknown
): Promise<{ error: string | null }> {
  const parsedData = changeStateSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: parsedData.error.message };
  }
  const { runner, state } = parsedData.data;
  const runnerToChange = runners.find((it) => it.name === runner);
  if (!runnerToChange) {
    return { error: `Runner ${runner} not found` };
  }
  runnerToChange.state = state;
  broadcastRunnersUpdate();
  return { error: null };
}

async function handleLobbyCode(
  ws: Bun.ServerWebSocket<unknown>,
  data: unknown
): Promise<{ error: string | null }> {
  const runner = runners.find((it) => it.ws === ws);
  if (!runner) {
    return { error: `Runner not found` };
  }
  const parsedData = lobbyCodeSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: parsedData.error.message };
  }

  console.log(`lobby code for ${runner.name} is ${parsedData.data.code}`);

  if (!runner.matchID) {
    return { error: `Match ID not found` };
  }

  try {
    await reportMatchCode(runner.matchID, parsedData.data.code, runner.callbackUrl);
  } catch (error) {
    console.error(`error reporting match code for ${runner.name}: ${error}`);
  }

  return { error: null };
}

async function processMessage(
  ws: Bun.ServerWebSocket<unknown>,
  message: string
): Promise<{ error: string | null }> {
  const parsedMessage = messagesClientSchema.safeParse(JSON.parse(message));
  if (!parsedMessage.success) {
    return { error: parsedMessage.error.message };
  }
  return messageHandlers[parsedMessage.data.type](ws, parsedMessage.data.data);
}

export async function sendMessageToClient(
  ws: Bun.ServerWebSocket<unknown>,
  message: SendMessageFromMaster
) {
  if (!ws) {
    return console.error(
      "try to send message to client but ws is not connected"
    );
  }
  ws.send(JSON.stringify(message));
}

export function broadcastRunnersUpdate() {
  const runnersData = runners.map(runner => ({
    name: runner.name,
    state: runner.state,
    matchID: runner.matchID,
    callbackUrl: runner.callbackUrl,
  }));

  const message: SendMessageFromMaster = {
    type: "runnersUpdate",
    data: { runners: runnersData }
  };

  openConnections.forEach(ws => {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending runners update:", error);
    }
  });
}

async function handleMatchEnded(
  ws: Bun.ServerWebSocket<unknown>,
  data: unknown
): Promise<{ error: string | null }> {
  const parsedData = matchEndedSchema.safeParse(data);
  if (!parsedData.success) {
    return { error: parsedData.error.message };
  }
  const runner = runners.find((it) => it.ws === ws);

  if (!runner) {
    return { error: `Runner not found` };
  }
  if (!runner.matchID) {
    return { error: `Match ID not found` };
  }

  console.log(`match ${runner.name} ended for ${parsedData.data.winner} with matchID ${runner.matchID}`);

  if (parsedData.data.winner === "error") {
    await reportMatchEnded(runner.matchID, null, "error", runner.callbackUrl);
  }

  if (parsedData.data.winner === "player dont connect to the lobby") {
    await reportMatchEnded(runner.matchID, null, "player dont connect to the lobby", runner.callbackUrl);
  }

  await reportMatchEnded(runner.matchID, parsedData.data.winner === "ct" ? "ct" : "t", null, runner.callbackUrl);

  runner.matchID = null;
  runner.callbackUrl = null;
  runner.state = "readyForCreateLobby";

  broadcastRunnersUpdate();
  return { error: null };
}
