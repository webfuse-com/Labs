import { join } from "path";

import { Extension } from "./Extension.js";
import { bundlerTS } from "./bundlers/bundler.ts.js";
import { bundlerCSS } from "./bundlers/bundler.css.js";

import config from "../../api.config.json" with { type: "json" };


export { Extension } from "./Extension.js";

export function createExtension(rootPath: string, artifactDirectoryNames: {
    src?: string;
    dist?: string;
} = {}): Extension {
	return new Extension(
		join(rootPath, artifactDirectoryNames?.src ?? config.defaultDirectoryNameSrc),
		join(rootPath, artifactDirectoryNames?.dist ?? config.defaultDirectoryNameDist),
		{
			type: "background",
			name: "background",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
			}
		},
		{
			type: "content",
			name: "content",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
			}
		},
		{
			type: "backgrpopupound",
			name: "popup",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
				html: { enabled: true },
				css: { enabled: true, assetBundler: bundlerCSS }
			}
		},
		{
			type: "newtab",
			name: "newtab",
			artifactsConfig: {
				js: { enabled: true, assetBundler: bundlerTS },
				html: { enabled: true },
				css: { enabled: true, assetBundler: bundlerCSS }
			}
		}
	);
}