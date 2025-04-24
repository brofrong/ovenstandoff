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
  const emulators = (await LD.list2()).slice(0,1);
  // const emulators = await LD.list2();

  for (let emulator of emulators) {
    const newLD = new LDPlayer(emulator.name);
    await newLD.start();
  }
}

await init();

  // await findAnchor(
  //   "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt\\imt-1745416070931.png",
  //   'menu_group'
  // );
  // await findAnchor(
  //   "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt\\imt-1745416070931.png",
  //   'play'
  // );
  // await findAnchor(
  //   "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt\\imt-1745416070931.png",
  //   'play'
  // );
  // await findAnchor(
  //   "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt\\imt-1745416070931.png",
  //   'menu_group'
  // );
  // await findAnchor(
  //   "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt\\imt-1745416070931.png",
  //   'menu_group'
  // );

// console.time("total");
// for (let i = 0; i < 100; i++) {
//   console.time("frame");
//  await Promise.all([
//     findAnchor(
//       "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt-1\\imt-1-1744964960295.png",
//       'play'
//     ),
//     findAnchor(
//       "C:\\Users\\dima7\\AppData\\Local\\ovenStandoff\\tmp\\imt-1\\imt-1-1744965002752.png",
//       'play'
//     )
//   ])
   
//   console.timeEnd("frame");
// }
// console.timeEnd("total");

// mainLoop();

// serve({
//   port: 3001,
//   routes: {
//     "/api/version": async () => {
//       return Response.json({version: 0.1});
//     },
//   },
// });

