import ProgressBar from "progress";
import { createWriteStream } from "fs";
import path from "path";

export const STANDOFF2_DOWNLOAD_URL =
  "https://d.apkpure.com/b/XAPK/com.axlebolt.standoff2?version=latest";

export const standoffOutputPath = (name: string) =>
  path.join('tmp', "standoff2", name);

// Function to download a file with a progress bar
export async function downloadLastVersion(url: string): Promise<{ isNew: boolean; filename: string; }> {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`
    );
  }

  const contentDisposition = response.headers.get("content-disposition");
  const filename = contentDisposition
    ?.split("filename=")
    .at(1)
    ?.replaceAll(/"/g, "")
    ?.replaceAll(" ", "_");

  if (!filename) {
    throw new Error("Couldn't get filename of the file to download");
  }

  if (await Bun.file(standoffOutputPath(filename)).exists()) {
    console.log(`Last version ${filename} already downloaded`);
    return { isNew: false, filename };
  }

  const totalSize = Number(response.headers.get("content-length"));
  if (!totalSize) {
    throw new Error("Couldn't get content-length header");
  }

  const bar = new ProgressBar("Downloading [:bar] :percent :etas", {
    width: 40,
    complete: "=",
    incomplete: " ",
    total: totalSize,
  });

  createFileIfNotExists(standoffOutputPath(filename));

  const fileStream = createWriteStream(standoffOutputPath(filename));

  const reader = response.body.getReader();

  async function pump() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        fileStream.write(value);
        bar.tick(value.length);
      }
    }
    fileStream.end();
  }

  await pump();
  console.log(`\nDownloaded to ${standoffOutputPath(filename)}`);
  return { isNew: true, filename };
}

async function createFileIfNotExists(path: string) {
  if (!(await Bun.file(path).exists())) {
    await Bun.write(path, "", { createPath: true });
  }
}
