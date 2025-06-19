import { $ } from 'bun';
import sharp from "sharp";
import { config } from '../src/config';
import { LDPlayer } from "../src/worker/ldconnector/ld";
import { initStorage } from '../src/worker/storage/init-storage';

const LD_PLAYER_NAME = 'imt-1';
const TIME_TO_CHECK = 20;

const checkImgApproach = async () => {
    const ldPlayer = await new LDPlayer(LD_PLAYER_NAME);

    const startTime = Date.now();

    for (let i = 0; i < TIME_TO_CHECK; i++) {
        const singleFrameTime = Date.now();
        const img = await ldPlayer.screenShot();
        const test = await sharp(img).raw().toBuffer();
        const endTime = Date.now();
        const timeTaken = endTime - singleFrameTime;
        console.log(`single frame taken: ${timeTaken}ms`);
    }

    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`\n\n\n!!!!!!!\nTime taken: ${timeTaken}ms\n average: ${timeTaken / TIME_TO_CHECK}ms\n!!!!!!!\n\n\n`);
}

const checkAdbApproach = async () => {
    const ldPlayer = await new LDPlayer(LD_PLAYER_NAME);
    const startTime = Date.now();
    for (let i = 0; i < TIME_TO_CHECK; i++) {
        const singleFrameTime = Date.now();
        const img = await $`${config.ldPath}/ldconsole.exe adb --name ${LD_PLAYER_NAME} --command "exec-out screencap -p"`.arrayBuffer();
        const test = await sharp(img).raw().toBuffer();
        console.log(`adb command taken: ${Date.now() - singleFrameTime}ms`);
    }
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`\n\n\n!!!!!!!\nTime taken: ${timeTaken}ms\n average: ${timeTaken / TIME_TO_CHECK}ms\n!!!!!!!\n\n\n`);
}

await initStorage();

// await checkImgApproach();
await checkAdbApproach();

