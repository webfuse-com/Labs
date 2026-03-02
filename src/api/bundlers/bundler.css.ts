import { build } from "esbuild";

import { AssetBundler } from "../AssetBundler.js";


export const bundlerCSS = new AssetBundler(
	async (rawData: string, absoluteDirectoryPath: string) => {
		return (
			await build({
				stdin: {
					contents: rawData,
					resolveDir: absoluteDirectoryPath,
					loader: "css"
				},
				write: false,
				bundle: true,
				minify: true
			})
		)
            .outputFiles[0]
            .text;
	}
);