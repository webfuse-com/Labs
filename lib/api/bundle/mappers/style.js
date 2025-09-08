import CSSMinifier from "clean-css";
import { compileString as transpileSCSS } from "sass";
import { Bundler } from "../mapping/Bundler.js";
import { Transpiler } from "../mapping/Transpiler.js";
export const bundlerCSS = new Bundler((css, debug) => {
    return minifierCSS.apply(css, debug);
});
export const bundlerSCSS = new Bundler(async (scss, debug) => {
    return minifierCSS.apply(await transpilerSCSS.apply(scss), debug);
});
export const transpilerSCSS = new Transpiler((scss) => {
    return transpileSCSS(scss).css;
});
export const minifierCSS = new Transpiler((css, debug) => {
    return !debug
        ? new CSSMinifier().minify(css).styles
        : css;
});
