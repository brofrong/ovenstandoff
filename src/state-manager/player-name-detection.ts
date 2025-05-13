import {loadBuffer} from '../img-proccesing/memo-img';
import { createWorker } from 'tesseract.js';



const playerNameBoxSizes = {
    width: 85,
    height: 17,
} as const;

const playerNameCoords: {x: number, y: number}[] = [
    {x: 342, y: 102},
    {x: 429, y: 102},
    {x: 516, y: 102},
    {x: 603, y: 102},
    {x: 690, y: 102},

    {x: 342, y: 172},
    {x: 429, y: 172},
    {x: 516, y: 172},
    {x: 603, y: 172},
    {x: 690, y: 172},
];

export async function getPlayerName(index: number, img: string) {
    const coord = playerNameCoords[index];
    const imgBuffer = await loadBuffer(img, {left: coord.x, top: coord.y, width: playerNameBoxSizes.width, height: playerNameBoxSizes.height});

    // //save imgBuffer to tmp file
    // const tmpFilePath = path.join(os.tmpdir(), `player-name-${index}.png`);
    // fs.writeFileSync(tmpFilePath, imgBuffer);

    const worker = await createWorker(['eng', 'rus']);
    const ret = await worker.recognize(imgBuffer);
    await worker.terminate();
    return ret.data.text;
}
