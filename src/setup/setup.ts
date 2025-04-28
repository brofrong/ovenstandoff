import { LD } from "../ldconnector/ld-command";
import { initStorage } from "../storage/init-storage";
import { wait } from "../unitls";

async function init() {
  await initStorage();

  console.log(await LD.install('imt-1', './apk/Copy_to_Clipboard.apk'));


  await wait(50 * 1000);
}

await init();