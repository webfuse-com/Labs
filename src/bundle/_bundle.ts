/**
 * Bundle handler module.
 * Command invokes bundle().
 * Emits the extension project bundle.
 */

import { readFile, cp } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

import * as prettier from "prettier";
import HTMLMinifier from "html-minifier";
import CSSMinifier from "clean-css";
import JSMinifier from "uglify-js";
import sharp from "sharp";

import { SRC_PATH, DIST_PATH, TARGET_DIRS, STATIC_PATH, STATIC_DIR } from "../constants.js";
import { load as loadTemplate, template } from "./templates.js";
import { TSfc, renderComponents } from "./sfc.js";

import { TPackageJson, getPackage } from "../package.js";
import { getAssetPath } from "../assets.js";
import manifest from "./manifest.json" with { type: "json" };
import EventEmitter from "events";
import { Modifier, Bundler } from "./Mappers.js";
import { transpileSCSS, transpileModulesScript } from "./transpilers.js";


const WATCH_INTERVAL: number = 1000;
const MARKUP_TEMPLATE: string = await loadTemplate("markup");


/**
 * Asset minifiers based on:
 * - HTML: html-minifier
 * - CSS: clean-css
 * - JS: uglify-js
 */
const minifierHTML = new Modifier(html => HTMLMinifier.minify(html, {
	minifyJS: true,
	minifyCSS: true,
	collapseWhitespace: true
}));
const minifierCSS = new Modifier(css => new CSSMinifier().minify(css).styles);
const minifierJS = new Modifier(js => JSMinifier.minify(js).code);

/**
 * HTML formatter based on prettier.
 * Required only to beautify indentation in debug mode.
 */
const formatterHTML = new Modifier(html => prettier.format(html, {
	parser: "html"
}));


/**
 * HTML bundler, requires SFC data:
 * 1. Fill markup template
 * 2. Apply formatter
 * 3. Apply minifier
 */
const bundlerHTML = new Bundler(async (html, debug, _, options: {
    name: string;
    target: string;
    sfcGlobal: TSfc;
    sfcShared: TSfc;
    sfc: TSfc;
}) => {
	let renderedHtml = MARKUP_TEMPLATE;
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
 * CSS bundler:
 * 1. Apply minifier
 */
const bundlerCSS = new Bundler((css, debug) => {
	return minifierCSS.apply(css, debug);
});
/**
 * SCSS bundler:
 * 1. Transpile SCSS to CSS
 * 2. Apply minifier
 */
const bundlerSCSS = new Bundler((scss, debug) => {
	return minifierCSS.apply(transpileSCSS(scss), debug);
});

/**
 * JS bundler:
 * 1. Apply minifier
 */
const bundlerJS = new Bundler(async (js, debug, path) => {
	return minifierJS.apply(await transpileModulesScript(js, "js", path), debug);
});
/**
 * TS bundler:
 * 1. Transpile TS to JS
 * 2. Apply minifier
 */
const bundlerTS = new Bundler(async (ts, debug, path) => {
	return minifierJS.apply(await transpileModulesScript(ts, "ts", path), debug);
});


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
const converterSVG_16 = new Bundler(svg => {
	return svgToPng(svg, 16);
}, true);
const converterSVG_32 = new Bundler(svg => {
	return svgToPng(svg, 32);
}, true);
const converterSVG_64 = new Bundler(svg => {
	return svgToPng(svg, 64);
}, true);
const converterSVG_128 = new Bundler(svg => {
	return svgToPng(svg, 128);
}, true);


const readGlobal = async (ext: string) => {
	return (await readFile(getAssetPath("bundle", `globals/global.${ext}`)))
        .toString();
};
/**
 * Global asset that affects all targets.
 */
const globals: Record<string, string> = {
	css: await readGlobal("css"),
	jss: await readGlobal("js")
};
/**
 * Global SFCs data.
 * Provides Webfuse components that can be reused across extensions for a consist UI.
 */
const sfcGlobal = await renderComponents(getAssetPath("bundle", "globals/components"), false, "webfuse-");


export type TBundleResults = {
	src: string;
	dist: string;
	count: number;
	ms: string;
};


/**
 * Clean up by deleting the current bundle (/dist directory).
 */
function cleanUp() {
	rmSync(DIST_PATH, {
		force: true,
		recursive: true
	});

	mkdirSync(DIST_PATH);
}

/**
 * Emit the bundle from all relevant files in the extension directory.
 * Called from handler interface, which in turn contains one-time calls.
 */
async function bundleAll(debug: boolean = false): Promise<TBundleResults> {
	const t0 = performance.now();

	await converterSVG_16.apply("icon.svg", "icon/16.png", debug);
	await converterSVG_32.apply("icon.svg", "icon/32.png", debug);
	await converterSVG_64.apply("icon.svg", "icon/64.png", debug);
	await converterSVG_128.apply("icon.svg", "icon/128.png", debug);

	await bundlerTS.apply("background.ts", undefined, debug);
	await bundlerJS.apply("background.js", undefined, debug); // prefer .js over .ts
	await bundlerTS.apply("content.ts", undefined, debug);
	await bundlerJS.apply("content.js", undefined, debug);    // prefer .js over .ts

	await bundlerTS.apply("shared/shared.ts", "shared.js", debug);
	await bundlerJS.apply("shared/shared.js", "shared.js", debug);      													// prefer .js over .ts
	let forceComponentRender = await bundlerSCSS.apply("shared/shared.scss", "shared.css", debug);
	    forceComponentRender = await bundlerCSS.apply("shared/shared.css", "shared.css", debug) || forceComponentRender;	// prefer .css over .scss

	const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"), forceComponentRender);

	await Promise.all(TARGET_DIRS
        .map(async target => {
        	const getSrcPath = (ext: string) => [ join(target, target), ext ].join(".");
        	const getDistPath = (ext: string) => [ target, ext ].join(".");

        	const sfc = await renderComponents(join(SRC_PATH, target, "components"), forceComponentRender);
        	const name = (await getPackage()).name ?? "";

        	await bundlerHTML
                .apply(getSrcPath("html"), getDistPath("html"), debug, true, (sfcShared.wasModified || sfc.wasModified), {
                	name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
                	target,
                	sfcGlobal, sfcShared, sfc
                });
        	await bundlerTS.apply(getSrcPath("ts"), getDistPath("js"), debug);
        	await bundlerJS.apply(getSrcPath("js"), getDistPath("js"), debug);      // prefer .js over .ts
        	await bundlerSCSS.apply(getSrcPath("scss"), getDistPath("css"), debug);
        	await bundlerCSS.apply(getSrcPath("css"), getDistPath("css"), debug);   // prefer .css over .scss
        }));

	const fileCount = Bundler.flushFileCount();
	fileCount && Bundler.updateTimestamp();

	return {
		src: SRC_PATH,
		dist: DIST_PATH,
		count: fileCount,
		ms: (performance.now() - t0).toPrecision(3)
	};
}


/**
 * CLI command handler interface.
 * Invoked from entry module.
 */
export async function bundle(debug?: boolean): Promise<EventEmitter> {
	cleanUp();

	existsSync(STATIC_PATH)
        && await cp(STATIC_PATH, join(DIST_PATH, STATIC_DIR), { recursive: true });

	const packageObj: TPackageJson = await getPackage();
	const manifestObj: {
        name?: string;
        version?: string;
    } = Object.assign({}, manifest);
	manifestObj.name = packageObj.name ?? "extension";
	manifestObj.version = packageObj.version ?? "1.0";
	await Bundler.emit("manifest.json", JSON.stringify(manifestObj, null, debug ? 2 : undefined));

	await Bundler.emit("global.css", await minifierCSS.apply(globals.css, debug));
	await Bundler.emit("global.js", await minifierJS.apply(globals.js, debug));

	// Expose event emitter to allow listening to bundleAll() calls.
	const emitter = new EventEmitter();

	const run = async () => {
		const stats = await bundleAll(debug);

		stats.count
            && setImmediate(() => emitter.emit("bundle", stats));

		setTimeout(run, WATCH_INTERVAL);
	};
	setImmediate(run);

	return emitter;
}