import { serve, ws } from "bun";
import { activeLdPlayers, LDPlayer } from "./src/ldconnector/ld";
import { LD } from "./src/ldconnector/ld-command";
const PATH_TO_LDCONSOLE = "D:/LDPlayer/LDPlayer9/ldconsole.exe";

import { StateManager } from "./src/state-manager/state-manager";
import { initStorage } from "./src/storage/init-storage";

async function init() {
  await initStorage();
  // stop all active ld clients
  // await LD.quitall();

  await startEmulators();

  // activate main loop
  const StateManagers = activeLdPlayers.map(
    (player) => new StateManager(player)
  );
  StateManagers.forEach((manager) => manager.run());
}

async function startEmulators() {
  const emulators = (await LD.list2()).filter(it => it.name !== 'clear').slice(0, 1);
  // const emulators = await LD.list2();

  for (let emulator of emulators) {
    const newLD = new LDPlayer(emulator.name);
    await newLD.start();
  }
}

await init();


// serve<{ name: string }>({
//   port: 3000,
//   websocket: {
//     open: (ws) => {
//       console.log("Client connected");
//     },
//     message: (ws, message) => {
//       console.log(`${ws.data.name}: ${message}`);
//     },
//     close: (ws) => {
//       console.log("Client disconnected");
//     },
//   },

//   fetch(req, server) {
//     const url = new URL(req.url);
//     if (url.pathname === "/chat") {
//       const upgraded = server.upgrade(req, {
//         data: {
//           name: new URL(req.url).searchParams.get("name"),
//         },
//       });
//       if (!upgraded) {
//         return new Response("Upgrade failed", { status: 400 });
//       }
//       return;
//     }
//     return new Response("Hello World");
//   },
// });