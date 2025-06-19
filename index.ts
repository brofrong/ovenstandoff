import program from "./src/cli";
import { setup } from './src/setup/setup';
import { startWorker } from './src/worker/index';


const command = program.parse(process.argv);

if (command.args.length === 0) {
  program.help();
}

if (command.args[0] === 'setup') {
  await setup();
}

if (command.args[0] === 'worker') {
  await startWorker();
}

