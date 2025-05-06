import { join } from "path";
import JSMinifier from "uglify-js";
import { SRC_PATH } from "../../constants.js";
import { Bundler } from "../mappers/Bundler.js";
import { Modifier } from "../mappers/Modifier.js";
import { transpileModulesScript } from "../transpilers.js";
export const bundlerJS = new Bundler(async (js, debug, path) => {
    return minifierJS.apply(await transpileModulesScript(js, "js", join(SRC_PATH, path)), debug);
});
export const bundlerTS = new Bundler(async (ts, debug, path) => {
    return minifierJS.apply(await transpileModulesScript(ts, "ts", join(SRC_PATH, path)), debug);
});
export const minifierJS = new Modifier(js => JSMinifier.minify(js).code);
