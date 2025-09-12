import * as prettier from "prettier";
import HTMLMinifier from "html-minifier";

import { Bundler } from "../mapping/Bundler.js";
import { Transpiler } from "../mapping/Transpiler.js";
import { TSfc } from "../sfc.js";
import { load as loadTemplate, template } from "../templates.js";


const MARKUP_TEMPLATE: string = await loadTemplate("markup");


/**
 * HTML bundler, requires SFC data:
 * 1. Fill markup template
 * 2. Apply formatter
 * 3. Apply minifier
 */
export const bundlerHTML = new Bundler(async (html: string, debug, _, options: {
    name: string;
    target: string;
    sfcGlobal: TSfc;
    sfcShared: TSfc;
    sfc: TSfc;
	noTemplate?: boolean;
}) => {
	let renderedHtml = !options.noTemplate ? MARKUP_TEMPLATE : "<!-- @HTML -->";
	renderedHtml = template(renderedHtml, "NAME", options.name);
	renderedHtml = template(renderedHtml, "TARGET", options.target);
	renderedHtml = template(renderedHtml, "GLOBAL_SFC_HTML", options.sfcGlobal.data.join("\n"));
	renderedHtml = template(renderedHtml, "SHARED_SFC_HTML", options.sfcShared.data.join("\n"));
	renderedHtml = template(renderedHtml, "SFC_HTML", options.sfc.data.join("\n"));
	renderedHtml = template(renderedHtml, "HTML", html);
	return minifierHTML
        .apply(await formatterHTML.apply(renderedHtml), debug);
});

/**
 * HTML formatter based on prettier.
 * Required only to beautify indentation in debug mode.
 */
export const formatterHTML = new Transpiler(html => prettier.format(html, {
	parser: "html"
}));

/**
 * HTML minifier based on 'html-minifier'.
 */
export const minifierHTML = new Transpiler((html, debug) => {
	return !debug
		? HTMLMinifier.minify(html, {
			minifyJS: true,
			minifyCSS: true,
			collapseWhitespace: true
		})
		: html;
});