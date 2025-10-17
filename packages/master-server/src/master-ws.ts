import { wsContract } from '@ovenstandoff/contract';
import { createServerSocket } from '@ovenstandoff/type-safe-socket';
import { reportMatchCode, reportMatchEnded } from './ch-server';
import { openConnections, runners, setRunners, viewers } from './services/runners';
import { log } from './utils/log';



export async function message(
  ws: Bun.ServerWebSocket<unknown>,
  message: string | Buffer
) {
  log.info(`message: ${ws}`);
  const ret = await openConnections.get(ws)?.newEvent(message.toString());
  if (ret?.error) {
    console.error(ret.error);
  }
}

export function open(ws: Bun.ServerWebSocket<unknown>) {
  log.info(`open: ${ws}`);
  const server = createServerSocket(wsContract, ws);
  applyMessageHandlers(ws, server);
  openConnections.set(ws, server);
}

export function close(ws: Bun.ServerWebSocket<unknown>, code: number, reason: string) {


  log.warn(`close: code: ${code}, reason: ${reason}`);
  const newRunnersList = runners.filter((it) => it.ws !== ws);
  setRunners(newRunnersList);

  openConnections.delete(ws);

  // Уведомляем клиентов об изменении списка runners
  broadcastRunnersUpdate();
}

const applyMessageHandlers = (ws: Bun.ServerWebSocket<unknown>, server: ReturnType<typeof createServerSocket<typeof wsContract, unknown>>) => {
  server.on.registerRunners((data) => {
    data.runners.forEach((it) => {
      runners.push({ name: it.name, ws, state: it.state, map: it.map, code: it.code, matchID: it.matchID, callbackUrl: it.callbackUrl, team: it.team, });
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

    runner.code = data.code;

    try {
      await reportMatchCode(runner.matchID, data.code, runner.callbackUrl);
    } catch (error) {
      console.error(`error reporting match code for ${runner.name}: ${error}`);
    }

    broadcastRunnersUpdate();

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
    runner.code = null;

    runner.state = "readyForCreateLobby";

    broadcastRunnersUpdate();
    return { error: null };
  });

  // Handle commands from master-server to runners
  server.on.startScreenStreamCommand((data) => {
    console.log(`Received startScreenStreamCommand for runner: ${data.runner}`);
    // Here the runner would start screen streaming
    // This is just a placeholder - the actual implementation would be in the runner
    return { error: null };
  });

  server.on.stopScreenStreamCommand((data) => {
    console.log(`Received stopScreenStreamCommand for runner: ${data.runner}`);
    // Here the runner would stop screen streaming
    // This is just a placeholder - the actual implementation would be in the runner
    return { error: null };
  });

  server.on.changeStateCommand((data) => {
    console.log(`Received changeStateCommand for runner: ${data.runner}, new state: ${data.state}`);
    // Here the runner would change its state
    // This is just a placeholder - the actual implementation would be in the runner
    return { error: null };
  });

  // Handle screen frames from workers
  server.on.sendScreenFrame((data) => {
    console.log(`Received screen frame from runner: ${data.runner}`);

    // Broadcast screen frame to all viewers using type-safe-socket
    viewers.forEach((viewerSocket) => {
      viewerSocket.send.screenFrame({
        runner: data.runner,
        frame: data.frame,
        timestamp: data.timestamp
      });
    });

    return { error: null };
  });


  // front-end
  server.requestHandler.registerView((data, accept, reject) => {
    viewers.add(server);

    accept({ runners: runners.map(runner => ({ name: runner.name, state: runner.state, map: runner.map, code: runner.code, matchID: runner.matchID, callbackUrl: runner.callbackUrl, team: runner.team })) });
    return { error: null };
  });

  // Screen streaming handlers
  server.requestHandler.startScreenStream((data, accept, reject) => {
    const runner = runners.find(r => r.name === data.runner);
    if (!runner) {
      reject("Runner not found");
      return { error: null };
    }

    // Send start streaming command to runner using type-safe-socket
    const runnerSocket = openConnections.get(runner.ws);
    if (runnerSocket) {
      runnerSocket.send.startScreenStreamCommand({
        runner: data.runner
      });
    }

    accept({ success: true, message: "Screen stream started" });
    return { error: null };
  });

  server.requestHandler.stopScreenStream((data, accept, reject) => {
    const runner = runners.find(r => r.name === data.runner);
    if (!runner) {
      reject("Runner not found");
      return { error: null };
    }

    // Send stop streaming command to runner using type-safe-socket
    const runnerSocket = openConnections.get(runner.ws);
    if (runnerSocket) {
      runnerSocket.send.stopScreenStreamCommand({
        runner: data.runner
      });
    }

    accept({ success: true, message: "Screen stream stopped" });
    return { error: null };
  });

  // State management handler
  server.requestHandler.changeRunnerState((data, accept, reject) => {
    const runner = runners.find(r => r.name === data.runner);
    if (!runner) {
      reject("Runner not found");
      return { error: null };
    }

    // Update runner state
    runner.state = data.state;
    broadcastRunnersUpdate();

    // Send state change command to runner using type-safe-socket
    const runnerSocket = openConnections.get(runner.ws);
    if (runnerSocket) {
      runnerSocket.send.changeStateCommand({
        runner: data.runner,
        state: data.state
      });
    }

    accept({ success: true, message: "Runner state changed" });
    return { error: null };
  });

  // Click command handler
  server.requestHandler.clickCommand((data, accept, reject) => {
    const runner = runners.find(r => r.name === data.runner);
    if (!runner) {
      reject("Runner not found");
      return { error: null };
    }

    // Check if runner is in debug state
    if (runner.state !== "debug") {
      reject("Runner is not in debug state");
      return { error: null };
    }

    // Send click command to runner using type-safe-socket
    const runnerSocket = openConnections.get(runner.ws);
    if (runnerSocket) {
      runnerSocket.send.clickCommandToRunner({
        runner: data.runner,
        x: data.x,
        y: data.y
      });
    }

    accept({ success: true, message: "Click command sent to runner" });
    return { error: null };
  });

}

export function broadcastRunnersUpdate() {

  const runnersData = runners.map(runner => ({
    name: runner.name,
    state: runner.state,
    matchID: runner.matchID,
    callbackUrl: runner.callbackUrl,
    map: runner.map,
    code: runner.code,
    team: runner.team
  }));

  log.info(`broadcastRunnersUpdate: ${JSON.stringify({ runners: runnersData })}`);


  viewers.forEach((socket) => {
    socket.send.updateRunners({ runners: runnersData });
  });
}
