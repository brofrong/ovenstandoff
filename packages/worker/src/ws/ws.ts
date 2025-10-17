
import type { ConfigWithRunners } from "@ovenstandoff/shared/src/config.type";
import { createClientSocket } from "@ovenstandoff/type-safe-socket";
import { wsContract } from '@ovenstandoff/contract/src/ws';
import { activeStateManagers } from "../state-manager/state-manager";
import { log } from "../utils/log";

let ws: WebSocket | null = null;
export let client: ReturnType<typeof createClientSocket<typeof wsContract, typeof ws>> | null = null;

export async function connectToMasterServer(config: ConfigWithRunners) {
  log.info(`connect to master server ${config.masterServerWsHost}/ws?auth=${config.secret}`);
  ws = new WebSocket(`${config.masterServerWsHost}/ws?auth=${config.secret}`);

  ws.addEventListener("open", async () => {
    log.info("Connected to master server");
    client = createClientSocket(wsContract, ws!);
    addEventListenerHandlers(client);


    client.send.registerRunners({
      runners: activeStateManagers.map((manager) => ({
        name: manager.ldPlayer.name,
        state: manager.state,
        map: manager.map,
        matchID: manager.matchID,
        callbackUrl: manager.callbackUrl,
        code: manager.lobbyCode,
        team: manager.teams.ct.length > 0 || manager.teams.t.length > 0 ? manager.teams : null,
      })),
    });
  });

  ws.addEventListener("error", (error) => {
    log.error({ error }, 'WebSocket error');
  });

  ws.addEventListener("message", async (event) => {
    log.info("Message from master server:", event.data);
    if (!client) {
      return console.error("Client not found!!!!!!!!");
    }
    const result = client.newEvent(event.data);

    if (result.error) {
      console.error("Invalid message from master server:", result.error);
      return;
    }
  });

  ws.addEventListener("close", () => {
    log.info("Disconnected from master server");

    // Stop all screen streaming when disconnected
    activeStateManagers.forEach(manager => {
      manager.stopScreenStream();
    });

    client = null;
    // Attempt to reconnect after delay
    setTimeout(() => connectToMasterServer(config), 5000);
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  return new Promise<void>((resolve) => {
    ws?.addEventListener("open", () => {
      resolve();
    });
  });
}

function addEventListenerHandlers(client: ReturnType<typeof createClientSocket<typeof wsContract, typeof ws>>) {
  client.on.startMatch(async (data) => {
    const { teams, runner, matchID, callbackUrl, map } = data;
    const runnerToStartMatch = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!runnerToStartMatch) {
      console.error("Runner to start match not found:", runner);
      return;
    }
    const result = await runnerToStartMatch.startCreatingLobby(teams, map, matchID || undefined, callbackUrl || undefined);
    if (result?.error) {
      console.error("Error starting match:", result.error);
    }
  });

  // Handle screen streaming commands
  client.on.startScreenStreamCommand(async (data) => {
    const { runner } = data;
    const stateManager = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!stateManager) {
      console.error("Runner not found for screen streaming:", runner);
      return;
    }

    log.info(`Starting screen stream for runner: ${runner}`);
    await stateManager.startScreenStream();
  });

  client.on.stopScreenStreamCommand(async (data) => {
    const { runner } = data;
    const stateManager = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!stateManager) {
      console.error("Runner not found for stopping screen stream:", runner);
      return;
    }

    log.info(`Stopping screen stream for runner: ${runner}`);
    await stateManager.stopScreenStream();
  });

  // Handle state change commands
  client.on.changeStateCommand(async (data) => {
    const { runner, state } = data;
    const stateManager = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!stateManager) {
      console.error("Runner not found for state change:", runner);
      return;
    }

    log.info(`Changing state for runner: ${runner} to: ${state}`);

    const oldState = stateManager.state;


    stateManager.state = state;

    if (oldState === 'readyForCreateLobby') {
      stateManager.run();
    }

    // Notify master server about state change
    if (client) {
      client.send.changeState({
        runner: runner,
        state: state
      });
    }
  });

  // Handle click commands
  client.on.clickCommandToRunner(async (data) => {
    const { runner, x, y } = data;
    const stateManager = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!stateManager) {
      console.error("Runner not found for click command:", runner);
      return;
    }

    log.info(`Click command for runner: ${runner} at coordinates: (${x}, ${y})`);

    // Execute click on the runner
    try {
      await stateManager.ldPlayer.click(x, y);
      log.info(`Click executed successfully at (${x}, ${y}) for runner: ${runner}`);
    } catch (error) {
      console.error(`Error executing click for runner ${runner}:`, error);
    }
  });
}
