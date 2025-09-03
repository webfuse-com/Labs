import { readFileSync } from "fs";
import { join } from "path";

import JSMinifier from "uglify-js";

import { SRC_PATH } from "../../../constants.js";
import { Bundler } from "../Bundler.js";
import { Modifier } from "../Modifier.js";
import { transpileModulesScript } from "../transpilers.js";


const ENHANCED_API = readFileSync(join(import.meta.dirname, "../../../enhanced-browser-api.js")).toString();

const createScriptBundler = (loader: "js" | "ts", enhanceBrowserAPI: boolean = false) => {
	return new Bundler(async (script: string, debug, path) => {
		return minifierJS.apply(
			enhanceBrowserAPI
				? await transpileModulesScript(script, loader, join(SRC_PATH, path))
				: script,
			debug
		);
	});
}

/**
 * JS bundler:
 */
export const bundlerJS = createScriptBundler("js");
export const bundlerComponentJS = createScriptBundler("js", true);

/**
 * TS bundler:
 */
export const bundlerTS = createScriptBundler("ts");
export const bundlerComponentTS = createScriptBundler("ts", true);

/**
 * JS minifier based on 'uglify-js'.
 */
export const minifierJS = new Modifier((js, debug) => {
	return !debug
		? JSMinifier.minify(js).code
		: js;
});

/**
 * Inject abstract browser API layer to JS.
 */
export const apiEnhanceJS = new Modifier(js => {
	return [
		ENHANCED_API,
		js
	].join("\n");
});