import { join } from "path";

import { ExtensionBuilder } from "./ExtensionBuilder.js";
import { bundlerTS } from "./bundlers/bundler.ts.js";
import { bundlerCSS } from "./bundlers/bundler.css.js";

import config from "../../api.config.json" with { type: "json" };


export { ExtensionBuilder } from "./ExtensionBuilder.js";

export function createExtensionBuilder(rootPath: string, artifactDirectoryNames: {
    src?: string;
    dist?: string;
} = {}): ExtensionBuilder {
	return new ExtensionBuilder(
		join(rootPath, artifactDirectoryNames?.src ?? config.defaultDirectoryNameSrc),
		join(rootPath, artifactDirectoryNames?.dist ?? config.defaultDirectoryNameDist),
		{
			name: "background",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
			}
		},
		{
			name: "content",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
			}
		},
		{
			name: "popup",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
				html: { enabled: true },
				css: { enabled: true, assetBundler: bundlerCSS }
			}
		},
		{
			name: "newtab",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
				html: { enabled: true },
				css: { enabled: true, assetBundler: bundlerCSS }
			}
		}
	);
}