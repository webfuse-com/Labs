import { readFileSync } from "fs";
import { join } from "path";
import JSMinifier from "uglify-js";
import { SRC_PATH } from "../../../constants.js";
import { Bundler } from "../Bundler.js";
import { Modifier } from "../Modifier.js";
import { transpileModulesScript } from "../transpilers.js";
const ENHANCED_API = readFileSync(join(import.meta.dirname, "../../../enhanced-browser-api.js")).toString();
const createScriptBundler = (loader, enhanceBrowserAPI = false) => {
    return new Bundler(async (script, debug, path) => {
        return minifierJS.apply(enhanceBrowserAPI
            ? await transpileModulesScript(script, loader, join(SRC_PATH, path))
            : script, debug);
    });
};
export const bundlerJS = createScriptBundler("js");
export const bundlerComponentJS = createScriptBundler("js", true);
export const bundlerTS = createScriptBundler("ts");
export const bundlerComponentTS = createScriptBundler("ts", true);
export const minifierJS = new Modifier((js, debug) => {
    return !debug
        ? JSMinifier.minify(js).code
        : js;
});
export const apiEnhanceJS = new Modifier(js => {
    return [
        ENHANCED_API,
        js
    ].join("\n");
});
