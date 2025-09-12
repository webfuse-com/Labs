import * as prettier from "prettier";
import HTMLMinifier from "html-minifier";
import { Bundler } from "../mapping/Bundler.js";
import { Transpiler } from "../mapping/Transpiler.js";
import { load as loadTemplate, template } from "../templates.js";
const MARKUP_TEMPLATE = await loadTemplate("markup");
export const bundlerHTML = new Bundler(async (html, debug, _, options) => {
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
export const formatterHTML = new Transpiler(html => prettier.format(html, {
    parser: "html"
}));
export const minifierHTML = new Transpiler((html, debug) => {
    return !debug
        ? HTMLMinifier.minify(html, {
            minifyJS: true,
            minifyCSS: true,
            collapseWhitespace: true
        })
        : html;
});
