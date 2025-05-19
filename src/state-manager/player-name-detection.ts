import {loadBuffer} from '../img-proccesing/memo-img';
import { createWorker } from 'tesseract.js';
import { slotsNames } from './state-manager';



const playerNameBoxSizes = {
    width: 85,
    height: 17,
} as const;

export const teamCoords = {
    ct: {
        "free_slot_1": {x: 536, y: 264},
        "free_slot_2": {x: 617, y: 264},
        "free_slot_3": {x: 698, y: 264},
        "free_slot_4": {x: 779, y: 264},
        "free_slot_5": {x: 860, y: 264},
        "free_slot_6": {x: 536, y: 312},
        "free_slot_7": {x: 617, y: 312},
        "free_slot_8": {x: 698, y: 312},
        "free_slot_9": {x: 779, y: 312},
        "free_slot_10": {x: 860, y: 312},
    },
    t: {
        "free_slot_1": {x: 536, y: 312},
        "free_slot_2": {x: 617, y: 312},
        "free_slot_3": {x: 698, y: 312},
        "free_slot_4": {x: 779, y: 312},
        "free_slot_5": {x: 860, y: 312},
        "free_slot_6": {x: 536, y: 360},
        "free_slot_7": {x: 617, y: 360},
        "free_slot_8": {x: 698, y: 360},
        "free_slot_9": {x: 779, y: 360},
        "free_slot_10": {x: 860, y: 360},
    }
} as const;

const playerNameCoords: Record<string, {x: number, y: number}> = {
    "free_slot_1": {x: 342, y: 102},
    "free_slot_2": {x: 429, y: 102},
    "free_slot_3": {x: 516, y: 102},
    "free_slot_4": {x: 603, y: 102},
    "free_slot_5": {x: 690, y: 102},

    "free_slot_6":{x: 342, y: 172},
    "free_slot_7":{x: 429, y: 172},
    "free_slot_8":{x: 516, y: 172},
    "free_slot_9":{x: 603, y: 172},
    "free_slot_10":{x: 690, y: 172},
};

export async function getPlayerName(slotName: string, img: string) {
    const coord = playerNameCoords[slotName];
    if(!coord) {
        return null;
    }
    const imgBuffer = await loadBuffer(img, {left: coord.x, top: coord.y, width: playerNameBoxSizes.width, height: playerNameBoxSizes.height});

    // //save imgBuffer to tmp file
    // const tmpFilePath = path.join(os.tmpdir(), `player-name-${index}.png`);
    // fs.writeFileSync(tmpFilePath, imgBuffer);

    const worker = await createWorker(['eng', 'rus']);
    const ret = await worker.recognize(imgBuffer);
    await worker.terminate();
    const unfilteredName = ret.data.text;

    // remove all non-latin characters
    const name = unfilteredName.replace(/[^a-zA-Z0-9а-яA-ЯёЁ]/g, '');

    return name;
}
