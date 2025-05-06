/**
 * Bundle handler module.
 * Command invokes bundle().
 * Emits the extension project bundle.
 */

import { readFile, cp } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import EventEmitter from "events";

import { SRC_PATH, DIST_PATH, TARGET_DIRS, STATIC_PATH, STATIC_DIR } from "../constants.js";
import { renderComponents } from "./sfc.js";

import { Bundler } from "./mappers/Bundler.js";
import { getAssetPath } from "../assets.js";
import { getPackage } from "../package.js";

import { converterSVG_16, converterSVG_32, converterSVG_64, converterSVG_128 } from "./bundlers/image.js";
import { bundlerSCSS, bundlerCSS, minifierCSS } from "./bundlers/css.js";
import { bundlerHTML } from "./bundlers/html.js";
import { bundlerTS, bundlerJS, minifierJS } from "./bundlers/js.js";
import { bundlerManifestJSON } from "./bundlers/json.js";


const WATCH_INTERVAL: number = 1000;


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

	const srcPath = (path: string) => existsSync(join(SRC_PATH, path))
		? path
		: null;
	const getSrcPath = (name: string, ext: string, path: string = "."): null|string => {
		return srcPath(join(path, [ name, ext ].join(".")))
			|| srcPath(join(path, ext, [ name, ext ].join(".")));
	};

	await bundlerManifestJSON.apply([
		getAssetPath("bundle", "manifest.json"),
		srcPath("../package.json")
	], "manifest.json", debug);

	await bundlerTS.apply(getSrcPath("background", "ts"), "background.js", debug);
	await bundlerJS.apply(getSrcPath("background", "js"), "background.js", debug);		// prefer .js over .ts
	await bundlerTS.apply(getSrcPath("content", "ts"), "content.js", debug);
	await bundlerJS.apply(getSrcPath("content", "js"), "content.js", debug);			// prefer .js over .ts

	await bundlerTS.apply(getSrcPath("shared", "ts", "shared"), "shared.js", debug);
	await bundlerJS.apply(getSrcPath("shared", "js", "shared"), "shared.js", debug);	// prefer .js over .ts
	let forceComponentRender = await bundlerSCSS.apply(getSrcPath("shared", "scss", "shared"), "shared.css", debug);
	    forceComponentRender = await bundlerCSS.apply(getSrcPath("shared", "css", "shared"), "shared.css", debug) || forceComponentRender;	// prefer .css over .scss

	const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"), forceComponentRender);

	await Promise.all(TARGET_DIRS
        .map(async target => {
        	const getTargetSrcPath = (ext: string): null|string => {
        		return getSrcPath(target, ext, target);
        	};
        	const getDistPath = (ext: string) => [ target, ext ].join(".");

        	const sfc = await renderComponents(join(SRC_PATH, target, "components"), forceComponentRender);
        	const name = (await getPackage()).name ?? "";

        	await bundlerHTML
                .apply(getTargetSrcPath("html"), getDistPath("html"), debug, true, (sfcShared.wasModified || sfc.wasModified), {
                	name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
                	target,
                	sfcGlobal, sfcShared, sfc
                });
        	await bundlerTS.apply(getTargetSrcPath("ts"), getDistPath("js"), debug);
        	await bundlerJS.apply(getTargetSrcPath("js"), getDistPath("js"), debug);      // prefer .js over .ts
        	await bundlerSCSS.apply(getTargetSrcPath("scss"), getDistPath("css"), debug);
        	await bundlerCSS.apply(getTargetSrcPath("css"), getDistPath("css"), debug);   // prefer .css over .scss
        }));

	const fileCount = Bundler.flushFileCount();
	fileCount
		&& Bundler.updateTimestamp();

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