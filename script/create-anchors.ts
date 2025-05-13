import * as fs from 'fs/promises';


const files = await fs.readdir('./anchors');

const jsonsFIles = files.filter(it => /.*\.json/.test(it));

const imports: {name: string, path: string; imgPath: string}[] = [];

for(let file of jsonsFIles) {
    const name: string = file.split('.').at(0)!;
    imports.push({name, path: file, imgPath: `${name}.png`});
}

let fileString = "";

for(let i of imports) {
    fileString += `import ${i.name}PNG from '../../anchors/${i.imgPath}' with { type: "file" };\nimport ${i.name}JSON from '../../anchors/${i.path}';\n`
}

fileString+= `\n\nexport const anchors = {\n`;


for(let i of imports) {
    fileString += `    '${i.name}': {img: ${i.name}PNG, offset: ${i.name}JSON },\n`
}

fileString+= `} as const;\n`;


await Bun.file('./src/img-proccesing/anchors.ts').write(fileString);