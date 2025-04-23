import appDirs from "appdirsjs";

export function wait(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

export const dirs = appDirs({ appName: "ovenStandoff" }).data;