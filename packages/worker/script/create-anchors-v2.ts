import * as fs from 'node:fs/promises'
import sharp from 'sharp'

type Import = {
  name: string
  path: string
  imgPath: string
  folder: string
}

await createAnchor()

async function createAnchor() {
  const allImports: Import[] = []

  const rootFiles = await fs.readdir('./anchors-v2', { withFileTypes: true })
  const rootFolders = rootFiles.filter((it) => it.isDirectory())

  for (const folder of rootFolders) {
    const files = await fs.readdir(`./anchors-v2/${folder.name}`)
    const jsonsFIles = files.filter((it) => /.*\.json/.test(it))
    const imports: Import[] = []

    for (const file of jsonsFIles) {
      const name: string = file.split('.').at(0)!
      imports.push({ name: name, path: file, imgPath: `${name}.png`, folder: folder.name })
      allImports.push({ name: name, path: file, imgPath: `${name}.png`, folder: folder.name })
    }

    for (const i of imports) {
      let fileString = ''
      fileString += `import ${dashToCamel(i.name)}PNG from '../../anchors-v2/${i.folder}/${i.imgPath}' with { type: "file" };\nimport ${dashToCamel(i.name)}JSON from '../../anchors-v2/${i.folder}/${i.path}';\n\n\n`

      const preview = await createPreview(`./anchors-v2/${i.folder}/${i.imgPath}`)

      const jsDoc = `/**\t* ${i.folder} - ${i.name}\n\t* @preview ${preview}\n*/\n`

      fileString += jsDoc
      fileString += `export const ${dashToCamel(`${i.folder}-${i.name}`)} = {\n\timg: ${dashToCamel(i.name)}PNG,\n\toffset: ${dashToCamel(i.name)}JSON,\n};\n`
      await Bun.file(`./src/anchors/${i.folder}-${i.name}.ts`).write(fileString)
    }
  }

  await createIndexFile(allImports)
}

function dashToCamel(str: string) {
  const result = str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  // удаляем все "-" если они остались
  return result.replace(/-/g, '');
}

function _capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// create img return base64 string
async function createPreview(imgPath: string): Promise<string> {
  const buffer = await sharp(imgPath)
    .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer()

  return `![img](data:image/jpeg;base64,${buffer.toString('base64')})`
}

async function createIndexFile(imports: Import[]) {
  let fileString = ''

  for (const i of imports) {
    fileString += `import {${dashToCamel(`${i.folder}-${i.name}`)}} from './${i.folder}-${i.name}';\n`
  }

  fileString += `\n\nexport const anchors = {\n`

  for (const i of imports) {
    const preview = await createPreview(`./anchors-v2/${i.folder}/${i.imgPath}`)
    const jsDoc = `\t/**\n\t* ${i.folder} - ${i.name}\n\t* @preview ${preview}\n\t*/\n`
    fileString += `${jsDoc}    ${dashToCamel(`${i.folder}-${i.name}`)}: ${dashToCamel(`${i.folder}-${i.name}`)},\n`
  }

  fileString += `} as const;\n`

  await Bun.file('./src/anchors/index.ts').write(fileString)
}
