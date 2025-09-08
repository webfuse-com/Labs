import sharp from "sharp";
import { Bundler } from "../mapping/Bundler.js";
const svgToPng = (svg, size) => {
    return sharp(svg)
        .resize(null, size)
        .png()
        .toBuffer();
};
export const converterSVG_16 = new Bundler((svg) => {
    return svgToPng(svg, 16);
}, true);
export const converterSVG_32 = new Bundler((svg) => {
    return svgToPng(svg, 32);
}, true);
export const converterSVG_64 = new Bundler((svg) => {
    return svgToPng(svg, 64);
}, true);
export const converterSVG_128 = new Bundler((svg) => {
    return svgToPng(svg, 128);
}, true);
