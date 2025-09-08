import { Bundler } from "../mapping/Bundler.js";


/**
 * Manifest bundler:
 * 1. 
 * 2. Apply minifier
 */
export const bundlerManifestJSON = new Bundler((data: string[], debug) => {
	const manifestObj = JSON.parse(data[0] || "{}") as {
        name: string;
        version: string;
        env?: {
            key: string;
            value: string;
        }[]
    };
	const packageObj = JSON.parse(data[1] || "{}") as {
        name?: string;
        version?: string;
    };

	manifestObj.name = packageObj.name ?? "extension";
	manifestObj.version = packageObj.version ?? "1.0";

	// .env
	if(data[2]) {
		const envObj = data[2]
            .split(/\n/g)
            .map((line: string) => line.trim())
            .filter((line: string) => /^[A-Z_]+=.*$/.test(line))
            .map((line: string) => line.split("=", 2))
            .map((tuple: [ string, string ]) => {
            	return {
            		key: tuple[0],
            		value: debug ? tuple[1] : ""
            	};
            });

		manifestObj.env = envObj;
	}

	return JSON.stringify(manifestObj, null, debug ? 2 : undefined);
});