declare module 'adm-zip' {
    class AdmZip {
        constructor(path: string);
        extractAllTo(targetPath: string, overwrite: boolean): void;
    }
    export default AdmZip;
} 