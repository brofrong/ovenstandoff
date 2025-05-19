import { activeLdPlayers, LDPlayer } from "./src/ldconnector/ld";
import { LD } from "./src/ldconnector/ld-command";
import { StateManager } from "./src/state-manager/state-manager";
import { initStorage } from "./src/storage/init-storage";
import { connectToMasterServer, sendMessageToMasterServer } from "./src/ws/ws";

async function init() {
  await initStorage();
  // stop all active ld clients
  // await LD.quitall();

  await startEmulators();

  // create state managers
  const StateManagers = activeLdPlayers.map(
    (player) => new StateManager(player)
  );

  // run players
  StateManagers.forEach((manager) => manager.run());

    // connect to master server
    await connectToMasterServer();
}

async function startEmulators() {
  const emulators = (await LD.list2()).filter(it => it.name !== 'clear').slice(0, 1);

  for (let emulator of emulators) {
    const newLD = new LDPlayer(emulator.name);
    await newLD.start();
  }
}

await init();

