
import type { ConfigWithRunners } from "@ovenstandoff/shared/src/config.type";
import { createClientSocket } from "@ovenstandoff/type-safe-socket";
import { wsContract } from '@ovenstandoff/contract/src/ws';
import { activeStateManagers } from "../state-manager/state-manager";

let ws: WebSocket | null = null;
export let client: ReturnType<typeof createClientSocket<typeof wsContract, typeof ws>> | null = null;

export async function connectToMasterServer(config: ConfigWithRunners) {
  console.log(`connect to master server ${config.masterServerWsHost}/ws?auth=${config.secret}`);
  ws = new WebSocket(`${config.masterServerWsHost}/ws?auth=${config.secret}`);

  ws.addEventListener("open", async () => {
    console.log("Connected to master server");
    client = createClientSocket(wsContract, ws!);
    addEventListenerHandlers(client);


    client.send.registerRunners({
      runners: activeStateManagers.map((manager) => ({
        runner: manager.ldPlayer.name,
        state: manager.state,
      })),
    });
  });

  ws.addEventListener("message", async (event) => {
    console.log("Message from master server:", event.data);
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
    console.log("Disconnected from master server");

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
    const { teams, runner } = data;
    const runnerToStartMatch = activeStateManagers.find(
      (it) => it.ldPlayer.name === runner
    );
    if (!runnerToStartMatch) {
      console.error("Runner to start match not found:", runner);
      return;
    }
    const result = await runnerToStartMatch.startCreatingLobby(teams);
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

    console.log(`Starting screen stream for runner: ${runner}`);
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

    console.log(`Stopping screen stream for runner: ${runner}`);
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

    console.log(`Changing state for runner: ${runner} to: ${state}`);
    stateManager.state = state;

    // Notify master server about state change
    if (client) {
      client.send.changeState({
        runner: runner,
        state: state
      });
    }
  });
}
