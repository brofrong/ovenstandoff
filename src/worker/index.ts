import { config } from "../config";
import { activeLdPlayers, LDPlayer } from "./ldconnector/ld";
import { LD } from "./ldconnector/ld-command";
import { StateManager } from "./state-manager/state-manager";
import { initStorage } from "./storage/init-storage";
import { connectToMasterServer } from "./ws/ws";

export async function startWorker() {
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
  let emulators;

  if (config.debug) {
    emulators = (await LD.list2())
      .filter((it) => it.name !== "clear")
      .slice(0, 1);
  } else {
    emulators = (await LD.list2()).filter((it) => it.name !== "clear");
  }

  for (let emulator of emulators) {
    const newLD = new LDPlayer(emulator.name);
    await newLD.start();
  }
}