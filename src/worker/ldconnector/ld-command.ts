import { config } from "../../config";
import { $ } from "bun";
import sharp from "sharp";


export const LD = {
  launch: (name: string) => {
    return $`${config.ldPath}\\ldconsole.exe launch --name ${name}`.text();
  },
  quit: (name: string) => {
    return $`${config.ldPath}\\ldconsole.exe quit --name ${name}`.text();
  },
  quitall: () => {
    return $`${config.ldPath}\\ldconsole.exe quitall`.text();
  },
  modify: async (
    name: string,
    params: {
      resolution?: { width: number; height: number; dpi: number };
      cpu?: number;
      memory?: number;
    }
  ) => {
    let toModify: string[] = [];

    if (params.resolution) {
      toModify.push("--resolution"),
        toModify.push(
          `${params.resolution.width},${params.resolution.height},${params.resolution.dpi}`
        );
    }

    if (params.cpu) {
      toModify.push(`--cpu ${params.cpu}`);
    }

    if (params.memory) {
      toModify.push(`--memory ${params.memory}`);
    }

    console.log(
      `${config.ldPath}\\ldconsole.exe modify --name ${name} ${toModify.join(" ")}`
    );
    return await $`${config.ldPath}\\ldconsole.exe modify --name ${name} ${toModify.join(" ")}`.text();
  },
  copy: async (newName: string, from: string | number) => {
    try {
      return await $`${config.ldPath}\\ldconsole.exe copy --name ${newName} --from ${from}`.text();
    } catch (e) {
      const id = (e as any)?.exitCode ?? 0;
      return id;
    }
  },
  runapp: (name: string, packagename: string) => {
    return $`${config.ldPath}\\ldconsole.exe runapp --name ${name} --packagename ${packagename}`.text();
  },
  killapp: (name: string, packagename: string) => {
    return $`${config.ldPath}\\ldconsole.exe killapp --name ${name} --packagename ${packagename}`.text();
  },
  list2: async () => {
    const ret: { name: string; index: number }[] = [];
    const consoleRet = await $`${config.ldPath}\\ldconsole.exe list2`.text();

    const emulatorsInfo = consoleRet.split("\n");

    for (let emulatorInfo of emulatorsInfo) {
      if (!emulatorInfo) continue;

      const [index, name] = emulatorInfo.split(",");
      ret.push({ index: +index, name });
    }

    return ret;
  },
  adb: (name: string, command: string) => {
    return $`${config.ldPath}\\ldconsole.exe adb --name ${name} --command "${command}"`.text();
  },
  screencap: async (name: string) => {
    const img =
      await $`${config.ldPath}\\ldconsole.exe adb --name ${name} --command "exec-out screencap -p"`.arrayBuffer();
    if (!img.byteLength) {
      return null;
    }
    const buffer = await sharp(img).toBuffer();
    return buffer;
  },
  isrunning: async (name: string): Promise<boolean> => {
    const bashret =
      await $`${config.ldPath}\\ldconsole.exe isrunning --name ${name}`.text();
    return bashret !== "stop";
  },
  click: (name: string, x: number, y: number) => {
    return $`${config.ldPath}\\ldconsole.exe adb --name ${name} --command "shell input tap ${x} ${y}"`.text();
  },
  install: (name: string, apkPath: string) => {
    return $`${config.ldPath}\\ldconsole.exe adb --name ${name} --command "install ${apkPath}`.text();
  },
  create: async (name: string): Promise<number> => {
    try {
      await $`${config.ldPath}\\ldconsole.exe add --name ${name}`.text();
    } catch (e) {
      const id = (e as any)?.exitCode ?? 0;
      console.log(`created ldPlayer with id ${id}`);
      return parseInt(id);
    }
    console.log(`created ldPlayer with id ${0}`);
    return 0;
  },
  delete: async (name: string) => {
    try {
      await $`${config.ldPath}\\ldconsole.exe remove --name ${name}`.text();
    } catch (e) {
      const id = (e as any)?.exitCode ?? 0;
      console.log(`deleted ldPlayer with id ${id}`);
      return e;
    }
    console.log(`deleted ldPlayer with id ${0}`);
    return 0;
  },

  deleteAllText: async (name: string) => {
    for (let i = 0; i < 20; i++) {
      await $`${config.ldPath}\\ldconsole.exe adb --name ${name} --command "shell input keyevent 67"`.text();
    }
    return;
  },
};
