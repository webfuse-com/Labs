import sharp from "sharp";

import { Bundler } from "../mappers/Bundler.js";


/**
 * SVG to PNG icon converter:
 * 1. Create Sharp object from SVG.
 * 2. Convert to PNG of respective size (height constraint).
 */
const svgToPng = (svg: string, size: number): string => {
	return sharp(svg)
        .resize(null, size)
        .png()
        .toBuffer() as unknown as string
};

export const converterSVG_16 = new Bundler((svg: string) => {
	return svgToPng(svg, 16);
}, true);
export const converterSVG_32 = new Bundler((svg: string) => {
	return svgToPng(svg, 32);
}, true);
export const converterSVG_64 = new Bundler((svg: string) => {
	return svgToPng(svg, 64);
}, true);
export const converterSVG_128 = new Bundler((svg: string) => {
	return svgToPng(svg, 128);
}, true);