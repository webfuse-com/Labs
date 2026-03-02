import { join } from "path";

import { ExtensionBuilder } from "./ExtensionBuilder";

import config from "../../config.json" with { type: "json" };


export function createExtensionBuilder(rootPath: string, artifactDirectoryNames: {
    src?: string;
    dist?: string;
} = {}): ExtensionBuilder {
	return new ExtensionBuilder(
		join(rootPath, artifactDirectoryNames?.src ?? config.defaultDirectoryNameSrc),
		join(rootPath, artifactDirectoryNames?.dist ?? config.defaultDirectoryNameDist),
		{
			name: "background"
		},
		{
			name: "popup",
			artifactsConfig: {
				html: true,
				js: true,
				css: true
			}
		},
		{
			name: "newtab",
			artifactsConfig: {
				html: true,
				js: true,
				css: true
			}
		}
	);
}