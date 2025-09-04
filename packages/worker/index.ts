import { getConfig, getLd } from "@ovenstandoff/shared";
import { activeLdPlayers, LDPlayer } from "./src/ldconnector/ld";
import { StateManager } from "./src/state-manager/state-manager";
import { initStorage } from "./src/storage/init-storage";
import { connectToMasterServer } from "./src/ws/ws";

export async function startWorker() {
  const config = await getConfig();
  const LD = getLd(config);

  await initStorage(LD);
  // stop all active ld clients
  // await LD.quitall();

  await startEmulators();


  // create state managers
  const StateManagers = activeLdPlayers.map(
    (player) => new StateManager(player, config)
  );

  // run players
  StateManagers.forEach((manager) => manager.run());

  // connect to master server
  await connectToMasterServer(config);
}

async function startEmulators() {
  let emulators;
  const config = await getConfig();
  const LD = getLd(config);
  if (config.debug) {
    emulators = (await LD.list2())
      .filter((it) => it.name !== "clear")
      .slice(0, 1);
  } else {
    emulators = (await LD.list2()).filter((it) => it.name !== "clear");
  }

  for (let emulator of emulators) {
    const newLD = new LDPlayer(emulator.name, LD);
    await newLD.start();
  }
}
