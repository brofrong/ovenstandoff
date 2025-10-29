import { getConfig } from '@ovenstandoff/shared';
import { $ } from 'bun';
import sharp from "sharp";
import { getLd } from '../../shared/src/ld-command';
import { LDPlayer } from '../src/ldconnector/ld';

const LD_PLAYER_NAME = 'CH auto 6';

const config = await getConfig();
const LD = getLd(config);
const ldPlayer = new LDPlayer(LD_PLAYER_NAME, LD);

const img = await $`${config.ldPath}\\ldconsole.exe adb --name ${LD_PLAYER_NAME} --command "exec-out screencap -p"`.arrayBuffer();
await sharp(img).toFile(`./img/${Date.now()}.png`);

console.log(`screenshot taken`);
