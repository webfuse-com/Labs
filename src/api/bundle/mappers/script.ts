import { readFileSync, existsSync } from "fs";
import { join, normalize } from "path";

import JSMinifier from "uglify-js";
import { build as esbuild, OnResolveArgs } from "esbuild";

import { SRC_PATH } from "../../../constants.js";
import { Bundler } from "../mapping/Bundler.js";
import { Transpiler } from "../mapping/Transpiler.js";

import _config from "../config.json" with { type: "json" };


const INJECT_CONTENT_JS = readFileSync(join(import.meta.dirname, "../../../inject-content.js")).toString();
const ENHANCED_API_JS = readFileSync(join(import.meta.dirname, "../../../enhance-webfuse-api.js")).toString();


const contentRendererJS = async (js: string) => {
	return injectContentJS.apply(
		await enhanceWebfuseApiJS.apply((js))
	);
};

// TODO: Separate content bundler logic
const createScriptBundler = (loader: "js" | "ts") => {
	return new Bundler(async (script: string, debug: boolean, path: string, content: {
		html?: string;
		css?: string;
	} = {}) => {
		const hasAugmentation: boolean = !!content?.html;

		const bundledScript: string = await  (
			hasAugmentation
				? contentRendererJS
				: ((js: string) => js)
		)(
			await transpilerScripts.apply(script, null, loader, join(SRC_PATH, path))
		);

		const varEncodeString = (identifier: string, str?: string) => {
			return str
				? `window.${identifier} = \`${str.replace(/`/g, "\\`")}\`;`
				: "";
		};

		const renderedScript = hasAugmentation
			? [
				varEncodeString("CONTENT_HTML", content.html),
				varEncodeString("CONTENT_CSS", content.css),
				bundledScript
			].join("\n")
			: bundledScript

		return !debug
			? minifierJS.apply(renderedScript)
			: renderedScript;
	});
}


/**
 * JS bundler:
 */
export const bundlerJS = createScriptBundler("js");

/**
 * TS bundler:
 */
export const bundlerTS = createScriptBundler("ts");


/**
 * Script transpiler (esbuild bundler, outputs JS).
 */
export const transpilerScripts = new Transpiler(async (code: string, _, loader: "js" | "ts", resolveDir: string) => {
	return (
		await esbuild({
			stdin: {
				loader,
				contents: code,
				resolveDir: resolveDir
			},
			bundle: true,
			write: false,
			platform: "browser",
			plugins: [
				{
					name: "restricted-imports",
					setup(build) {
						build.onResolve({
							filter: /.*/
						}, (args: OnResolveArgs) => {
							const normalizedImportPath: string = normalize(join(args.resolveDir, args.path));

							const isSharedPath = (path: string) => {
								const rootPath = normalize(join(SRC_PATH, "shared"));
								return path.slice(0, rootPath.length) === rootPath;
							};
							if(isSharedPath(normalizedImportPath))
								return {
									path: normalizedImportPath
								};

							const sharedPrefixRegex = new RegExp(`^${_config.sharedModulesPrefix}`);
							if(sharedPrefixRegex.test(args.path)) {
								const inferPath = (subDirectory = ".") => {
									const inferredPath = join(SRC_PATH, "shared", subDirectory, args.path.replace(sharedPrefixRegex, ""));
									return existsSync(inferredPath)
										? inferredPath
										: null;
								};

								const inferredPath = inferPath() || inferPath("js") || inferPath("ts");
								if(!inferredPath)
									throw new ReferenceError(`Shared module not found ${args.path}`);

								return {
									path: inferredPath
								};
							}

							// TODO: Constrain cross-target dir imports

							return null;
						});
					}
				}
			]
		})
	)
		.outputFiles[0]
		.text;
});

/**
 * JS minifier based on 'uglify-js'.
 */
export const minifierJS = new Transpiler((js, debug) => {
	return !debug
		? JSMinifier.minify(js).code
		: js;
});

/**
 * Inject content (soft component) injection logic to JS.
 */
export const injectContentJS = new Transpiler(js => {
	return [
		INJECT_CONTENT_JS,
		js
	].join("\n");
});

/**
 * Inject abstract browser API layer to JS.
 */
export const enhanceWebfuseApiJS = new Transpiler(js => {
	return [
		ENHANCED_API_JS,
		js
	].join("\n");
});