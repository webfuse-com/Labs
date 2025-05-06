/**
 * CSS minifier based on 'clean-css'.
 */

import CSSMinifier from "clean-css";

import { Bundler } from "../mappers/Bundler.js";
import { Modifier } from "../mappers/Modifier.js";
import { transpileSCSS } from "../transpilers.js";


/**
 * CSS bundler:
 * 1. Apply minifier
 */
export const bundlerCSS = new Bundler((css: string, debug) => {
	return minifierCSS.apply(css, debug);
});
/**
 * SCSS bundler:
 * 1. Transpile SCSS to CSS
 * 2. Apply minifier
 */
export const bundlerSCSS = new Bundler((scss: string, debug) => {
	return minifierCSS.apply(transpileSCSS(scss), debug);
});

/**
 * CSS minifier based on 'clean-css'.
 */
export const minifierCSS = new Modifier(css => new CSSMinifier().minify(css).styles);