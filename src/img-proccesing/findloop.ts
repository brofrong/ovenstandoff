import { anchors } from "./anchors";
import { findAnchor } from "./img-proccesing";
import { wait } from "../unitls";
import type { LDPlayer } from "../ldconnector/ld";
import { deletePNG } from "../storage/init-storage";

export async function findLoop(anchorKey: keyof typeof anchors, player: LDPlayer, options?: {times?: number, wait?: number}): Promise<{sucess: true, error: false} | {sucess: false, error: true}> {
    const defaultOptions = {times: 3, wait: 500};
    const _options = Object.assign(defaultOptions, options); 

    return new Promise(async (res) => {

        for(let i = 0; i< _options.times; i++) {
            const screenShot = await player.screenShot();
            if(await findAnchor(screenShot, anchorKey)) {
                return res({sucess: true, error: false});
            }
            await wait(_options.wait);
            await deletePNG(screenShot);
        }

        return res({sucess: false, error: true});
    });
}