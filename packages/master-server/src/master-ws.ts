import { wsContract } from '@ovenstandoff/contract';
import { createServerSocket } from '@ovenstandoff/type-safe-socket';
import { reportMatchCode, reportMatchEnded } from './ch-server';
import { openConnections, runners, setRunners } from './services/runners';



export async function message(
  ws: Bun.ServerWebSocket<unknown>,
  message: string | Buffer
) {
  const ret = await openConnections.get(ws)?.newEvent(message.toString());
  if (ret?.error) {
    console.error(ret.error);
  }
  // // Echo the message back
  // const { error } = await processMessage(ws, message.toString());
  // if (error) {
  //   ws.send(JSON.stringify({ error: error }));
  // }
}

export function open(ws: Bun.ServerWebSocket<unknown>) {
  const server = createServerSocket(wsContract, ws);
  applyMessageHandlers(ws, server);
  openConnections.set(ws, server);
}

export function close(ws: Bun.ServerWebSocket<unknown>) {
  console.log("Client disconnected");
  const newRunnersList = runners.filter((it) => it.ws !== ws);
  setRunners(newRunnersList);

  openConnections.delete(ws);

  // Уведомляем клиентов об изменении списка runners
  broadcastRunnersUpdate();
}

const applyMessageHandlers = (ws: Bun.ServerWebSocket<unknown>, server: ReturnType<typeof createServerSocket<typeof wsContract, unknown>>) => {
  server.on.registerRunners((data) => {
    data.runners.forEach((it) => {
      runners.push({ name: it.runner, ws, state: it.state, matchID: null, callbackUrl: null });
    });
    broadcastRunnersUpdate();
    return { error: null };
  });

  server.on.changeState((data) => {
    const runnerToChange = runners.find((it) => it.name === data.runner);
    if (!runnerToChange) {
      return { error: `Runner ${data.runner} not found` };
    }
    runnerToChange.state = data.state;
    broadcastRunnersUpdate();
    return { error: null };
  });

  server.on.lobbyCode(async (data) => {
    const runner = runners.find((it) => it.ws === ws);
    if (!runner) {
      return { error: `Runner not found` };
    }

    console.log(`lobby code for ${runner.name} is ${data.code}`);

    if (!runner.matchID) {
      return { error: `Match ID not found` };
    }

    try {
      await reportMatchCode(runner.matchID, data.code, runner.callbackUrl);
    } catch (error) {
      console.error(`error reporting match code for ${runner.name}: ${error}`);
    }

    return { error: null };
  });

  server.on.matchEnded(async (data) => {
    const runner = runners.find((it) => it.ws === ws);

    if (!runner) {
      return { error: `Runner not found` };
    }
    if (!runner.matchID) {
      return { error: `Match ID not found` };
    }

    console.log(`match ${runner.name} ended for ${data.winner} with matchID ${runner.matchID}`);

    if (data.winner === "error") {
      await reportMatchEnded(runner.matchID, null, "error", runner.callbackUrl);
    }

    if (data.winner === "player dont connect to the lobby") {
      await reportMatchEnded(runner.matchID, null, "player dont connect to the lobby", runner.callbackUrl);
    }

    await reportMatchEnded(runner.matchID, data.winner === "ct" ? "ct" : "t", null, runner.callbackUrl);

    runner.matchID = null;
    runner.callbackUrl = null;
    runner.state = "readyForCreateLobby";

    broadcastRunnersUpdate();
    return { error: null };
  });

}

export function broadcastRunnersUpdate() {
  const runnersData = runners.map(runner => ({
    name: runner.name,
    state: runner.state,
    matchID: runner.matchID,
    callbackUrl: runner.callbackUrl,
  }));
}
