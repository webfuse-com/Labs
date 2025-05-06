import { Bundler } from "../mappers/Bundler.js";


/**
 * Manifest bundler:
 * 1. 
 * 2. Apply minifier
 */
export const bundlerManifestJSON = new Bundler(async (data: string[], debug) => {
    const manifestObj: {
        name?: string;
        version?: string;
    } = JSON.parse(data[0] || "{}");
    const packageObj: {
        name?: string;
        version?: string;
    } = JSON.parse(data[1] || "{}");

    manifestObj.name = packageObj.name ?? "extension";
    manifestObj.version = packageObj.version ?? "1.0";

    return JSON.stringify(manifestObj, null, debug ? 2 : undefined);
});