import CSSMinifier from "clean-css";
import { Bundler } from "../Bundler.js";
import { Modifier } from "../Modifier.js";
import { transpileSCSS } from "../transpilers.js";
export const bundlerCSS = new Bundler((css, debug) => {
    return minifierCSS.apply(css, debug);
});
export const bundlerSCSS = new Bundler((scss, debug) => {
    return minifierCSS.apply(transpileSCSS(scss), debug);
});
export const minifierCSS = new Modifier((css, debug) => {
    return !debug
        ? new CSSMinifier().minify(css).styles
        : css;
});
