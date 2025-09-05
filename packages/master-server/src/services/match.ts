import type { masterContract } from "@ovenstandoff/contract";
import type { ClientInferResponseBody, ServerInferRequest, ServerInferResponses } from "@ts-rest/core";
import { broadcastRunnersUpdate } from "../master-ws";
import { registerClients } from "../register-client";
import { env } from "../utils/env";
import { openConnections, runners } from "./runners";

export async function startMatchHandler(request: ServerInferRequest<typeof masterContract.startMatch>): Promise<ServerInferResponses<typeof masterContract.startMatch>> {
  const body = request.body;

  const { teams } = body;

  const freeManager = Object.values(runners).find(
    (it) => it.state === "readyForCreateLobby"
  );
  if (!freeManager) {
    return { status: 503, body: "No free manager" };
  }
  freeManager.state = "createLobby";
  freeManager.callbackUrl = body.callbackUrl;
  freeManager.matchID = body.matchID;
  freeManager.team = body.teams;

  const socket = openConnections.get(freeManager.ws);

  if (!socket) {
    return { status: 503, body: "No free manager" };
  }

  socket.send.startMatch({ teams, runner: freeManager.name });

  broadcastRunnersUpdate();

  return { status: 200, body: "Match started" };
}

export async function registerClientsHandler(request: ServerInferRequest<typeof masterContract.registerClients>): Promise<ServerInferResponses<typeof masterContract.registerClients>> {
  const { count } = request.body;

  console.log(`register ${count} clients`);

  const resData = await registerClients(count);

  const returnData: ClientInferResponseBody<typeof masterContract.registerClients, 200> = [];

  const emails = env.EMAILS;
  const emailsLength = emails.length;
  const passwords = env.PASSWORDS;
  const passwordsLength = passwords.length;

  for (let i = resData.startID; i < resData.endID; i++) {
    returnData.push({
      id: i,
      name: `CH auto ${i + 1}`,
      nameIsChanged: 0,
      lowSettings: 0,
      email: env.EMAILS[i % emailsLength]!,
      password: env.PASSWORDS[i % passwordsLength]!,
    });
  }

  return { status: 200, body: returnData };
}



// async function handleEndMatch(req: ServerInferRequest<typeof masterContract.endMatch>) {
//   try {
//     const body = await req.json();
//     const parsedBody = endMatchSchema.safeParse(body);

//     if (!parsedBody.success) {
//       return new Response("Invalid request", { status: 400 });
//     }

//     const { runner: runnerName, winner } = parsedBody.data;

//     // Находим runner по имени
//     const runner = runners.find(r => r.name === runnerName);
//     if (!runner) {
//       return new Response("Runner not found", { status: 404 });
//     }

//     if (!runner.matchID) {
//       return new Response("Runner is not in a match", { status: 400 });
//     }

//     // Отправляем сообщение о завершении матча через WebSocket
//     sendMessageToClient(runner.ws, {
//       type: "matchEnded",
//       data: { winner }
//     });

//     // Отправляем уведомление через callback URL
//     const matchID = runner.matchID;
//     const callbackUrl = runner.callbackUrl;

//     if (winner === "error") {
//       await reportMatchEnded(matchID, null, "Match ended with error", callbackUrl);
//     } else {
//       await reportMatchEnded(matchID, winner as "ct" | "t", null, callbackUrl);
//     }

//     // Сбрасываем matchID
//     runner.matchID = null;
//     runner.callbackUrl = null;
//     runner.state = "readyForCreateLobby";

//     broadcastRunnersUpdate();

//     return new Response("Match ended successfully", { status: 200 });
//   } catch (error) {
//     console.error("Error ending match:", error);
//     return new Response("Internal server error", { status: 500 });
//   }
// }
