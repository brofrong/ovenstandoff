import { config } from "../config";
import type { Config } from "./config.schema";
import {CONFIG_PATH} from './init-storage';


export async function updateRunnerInfo(name: string, lowSettings: boolean){
    const runner = config.runners.find(runner => runner.name === name);
    if(!runner) {
        throw new Error(`Runner ${name} not found`);
    }

    runner.lowSettings = lowSettings;
    await writeConfig(config);
}

async function writeConfig(config: Config) {
    return Bun.write(CONFIG_PATH, JSON.stringify(config));
}
