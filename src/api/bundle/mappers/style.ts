/**
 * CSS minifier based on 'clean-css'.
 */

import CSSMinifier from "clean-css";
import { compileString as transpileSCSS } from "sass";

import { Bundler } from "../mapping/Bundler.js";
import { Transpiler } from "../mapping/Transpiler.js";


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
export const bundlerSCSS = new Bundler(async (scss: string, debug) => {
	return minifierCSS.apply(await transpilerSCSS.apply(scss), debug);
});


/**
 * SCSS transpiler.
 */
export const transpilerSCSS = new Transpiler((scss: string) => {
	return transpileSCSS(scss).css;
});

/**
 * CSS minifier based on 'clean-css'.
 */
export const minifierCSS = new Transpiler((css, debug) => {
	return !debug
		? new CSSMinifier().minify(css).styles
		: css;
});	