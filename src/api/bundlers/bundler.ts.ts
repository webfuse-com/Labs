import { build } from "esbuild";

import { AssetBundler } from "../AssetBundler.js";


export const bundlerTS = new AssetBundler(
	async (rawData: string, absoluteDirectoryPath: string) => {
		return (
			await build({
				stdin: {
					contents: rawData,
					resolveDir: absoluteDirectoryPath,
					loader: "ts"
				},
				write: false,
				bundle: true,
				minify: true,
				format: "esm",
				platform: "node",
				target: "es2022"
			})
		)
            .outputFiles[0]
            .text;
	}
);