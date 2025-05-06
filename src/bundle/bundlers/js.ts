import { join } from "path";

import JSMinifier from "uglify-js";

import { SRC_PATH } from "../../constants.js";
import { Bundler } from "../mappers/Bundler.js";
import { Modifier } from "../mappers/Modifier.js";
import { transpileModulesScript } from "../transpilers.js";


/**
 * JS bundler:
 * 1. Apply minifier
 */
export const bundlerJS = new Bundler(async (js: string, debug, path) => {
	return minifierJS.apply(await transpileModulesScript(js, "js", join(SRC_PATH, path)), debug);
});

/**
 * TS bundler:
 * 1. Transpile TS to JS
 * 2. Apply minifier
 */
export const bundlerTS = new Bundler(async (ts: string, debug, path) => {
	return minifierJS.apply(await transpileModulesScript(ts, "ts", join(SRC_PATH, path)), debug);
});

/**
 * JS minifier based on 'uglify-js'.
 */
export const minifierJS = new Modifier(js => JSMinifier.minify(js).code);