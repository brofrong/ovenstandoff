import { config } from "../config";
import {
  messagesMasterSchema,
  type SendMessageFromClient,
  startMatchSchema,
} from "../master-server/messages.schema";
import { activeStateManagers } from "../state-manager/state-manager";

let ws: WebSocket | null = null;

export async function connectToMasterServer() {
  ws = new WebSocket(config.masterServerHost);

  ws.addEventListener("open", async () => {
    console.log("Connected to master server");
    // register runners
    await sendMessageToMasterServer({
      type: "registerRunners",
      data: {
        runners: activeStateManagers.map((manager) => ({
          runner: manager.ldPlayer.name,
          state: manager.state,
        })),
      },
    });
  });

  ws.addEventListener("message", async (event) => {
    console.log("Message from master server:", event.data);
    const message = messagesMasterSchema.safeParse(JSON.parse(event.data));
    if (!message.success) {
      console.error("Invalid message from master server:", message.error);
      return;
    }
    const { type, data } = message.data;
    if (type === "startMatch") {
      const parsedData = startMatchSchema.safeParse(data);
      if (!parsedData.success) {
        console.error("Invalid start match data:", parsedData.error);
        return;
      }
      const { teams, runner } = parsedData.data;
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
    }
  });

  ws.addEventListener("close", () => {
    console.log("Disconnected from master server");
    // Attempt to reconnect after delay
    setTimeout(() => connectToMasterServer(), 5000);
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

export async function sendMessageToMasterServer(
  message: SendMessageFromClient
) {
  if (!ws) {
    return;
  }
  ws.send(JSON.stringify(message));
}
