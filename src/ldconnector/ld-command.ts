import { config } from "../config";
import {$} from 'bun';

type CommandProps = {
    command: ''
}


export const LD = {
    launch: (name: string) => {
        return $`${config.ldconsolePath} launch --name ${name}`.text();
    },
    quit: (name: string) => {
        return $`${config.ldconsolePath} quit --name ${name}`.text();
    },
    quitall: () => {
        return $`${config.ldconsolePath} quitall`.text();
    },
    modify: (name: string, params: {resolution?: {width: number, height: number, dpi: number}, cpu?: number, memory?: number}) => {
        let toModify: string[] = [];

        if(params.resolution) {
            toModify.push('--resolution'),
            toModify.push(`${params.resolution.width},${params.resolution.height},${params.resolution.dpi}`);
        }
        
        if(params.cpu) {
            toModify.push(`--cpu ${params.cpu}`)
        }

        if(params.memory) {
            toModify.push(`--memory ${params.memory}`)
        }


        return $`${config.ldconsolePath} modify --name ${name} ${toModify.join(' ')}`.text();
    },
    copy: (newName: string, from:  string | number) => {
        return $`${config.ldconsolePath} copy --name ${newName} --from ${from}`.text() ;
    },
    runapp: (name: string, packagename: string) => {
        return $`${config.ldconsolePath} runapp --name ${name} --packagename ${packagename}`.text();
    },
    killapp: (name: string, packagename: string) => {
        return $`${config.ldconsolePath} killapp --name ${name} --packagename ${packagename}`.text();
    },
    list2: async () => {
        const ret: {name: string, index: number}[] = [];
        const consoleRet = await $`${config.ldconsolePath} list2`.text();
        
        const emulatorsInfo = consoleRet.split('\n');

        for (let emulatorInfo of emulatorsInfo) {
            if(!emulatorInfo) continue;

            const [index, name] = emulatorInfo.split(',');
            ret.push({index: +index, name});
        }

        return ret;
    },
    adb: (name: string, command: string) => {
        return $`${config.ldconsolePath} adb --name ${name} --command "${command}"`.text();
    },
    isrunning: async (name: string): Promise<boolean> => {
        const bashret =  await $`${config.ldconsolePath} isrunning --name ${name}`.text();
        return bashret !== 'stop'
    },
    click: (name: string, x: number, y: number) => {
        return $`${config.ldconsolePath} adb --name ${name} --command "shell input tap ${x} ${y}"`.text();
    },
    install: (name: string, apkPath: string) => {
        return $`${config.ldconsolePath} adb --name ${name} --command "install ${apkPath}`.text();
    },
    
}

//D:/LDPlayer/LDPlayer9/ldconsole.exe adb --name imt --command "push C:\Users\dima7\work\ovenstandoff\standoff2\Android\obb\com.axlebolt.standoff2 /storage/emulated/0/Android/obb/"                                   
// async function test(name: string) {
//   for(let i = 0; i < 10; i++) {
//     const ts = Date.now();
//     console.time(`screencap-${name}`);
//     const ret = await $`${PATH_TO_LDCONSOLE} adb --name ${name} --command "shell screencap -p /sdcard/screencap${ts}.png" && ${PATH_TO_LDCONSOLE} adb --name ${name} --command "pull /sdcard/screencap${ts}.png ./tmp/${name}"`.text();
//     // const ret2 = await $``.text();
//     console.timeEnd(`screencap-${name}`);
//     console.log(ret);
//   }
// }