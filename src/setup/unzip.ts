import { standoffOutputPath } from "./download-last-version";
import path from "path";
import AdmZip from "adm-zip";
import { isFolderExists } from "../unitls";

export async function unzip(lastVersion: string) {
  const filenameWithoutExtension = path.basename(lastVersion, ".xapk");
  const outputDir = standoffOutputPath(filenameWithoutExtension);

  if (await isFolderExists(outputDir)) {
    console.log(`${outputDir} already exists`);
    return outputDir;
  }

  const xapkPath = standoffOutputPath(lastVersion);
  const zip = new AdmZip(xapkPath);
  zip.extractAllTo(outputDir, true);
  console.log(`${outputDir} unzipped successfully`);
  return outputDir;
}
