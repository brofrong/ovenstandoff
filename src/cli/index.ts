import { Command } from "commander";

const program = new Command();

program
  .name('oven-standoff')
  .description('CLI to manage worker for creating auto matches for standoff')
  .version('0.1.1');

program.command('setup')
  .description('Setup LD player');


program.command('master')
  .description('Start master server');

program.command('worker')
  .description('Start worker client');

export default program;