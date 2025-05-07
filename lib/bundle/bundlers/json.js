import { Bundler } from "../mappers/Bundler.js";
export const bundlerManifestJSON = new Bundler((data, debug) => {
    const manifestObj = JSON.parse(data[0] || "{}");
    const packageObj = JSON.parse(data[1] || "{}");
    manifestObj.name = packageObj.name ?? "extension";
    manifestObj.version = packageObj.version ?? "1.0";
    if (data[2]) {
        const envObj = data[2]
            .split(/\n/g)
            .map((line) => line.trim())
            .filter((line) => /^[A-Z_]+=.*$/.test(line))
            .map((line) => line.split("=", 2))
            .map((tuple) => {
            return {
                key: tuple[0],
                value: debug ? tuple[1] : ""
            };
        });
        manifestObj.env = envObj;
    }
    return JSON.stringify(manifestObj, null, debug ? 2 : undefined);
});
