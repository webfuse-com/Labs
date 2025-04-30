/**
 * Transpiler utilities abstracting framework-specific configuration.
 */

import { join } from "path";

import { compileString as transpile_SCSS } from "sass";
import { TranspileOptions, transpileModule as transpile_TS, flattenDiagnosticMessageText } from "typescript";
import { build as esbuild } from "esbuild";

import { SRC_PATH } from "../constants.js";

import tsconfig from "./tsconfig.json" with { type: "json" };


export function transpileSCSS(scss: string): string {
	return transpile_SCSS(scss).css;
}

export function transpileTS(ts: string): string {
	const result = transpile_TS(ts, tsconfig as unknown as TranspileOptions);
	if (!result?.diagnostics.length) {
		return result.outputText;
	}

	throw new AggregateError(
		result.diagnostics
            .map(diagnostic => new Error(
            	flattenDiagnosticMessageText(diagnostic.messageText, "\n")
            )),
		"TS compiler errors"
	);
}

export async function transpileModulesScript(code: string, loader: "js"|"ts", resolveDir: string): Promise<string> {
	return (
		await esbuild({
			stdin: {
				loader,
				contents: code,
				resolveDir: join(SRC_PATH, resolveDir)
			},
			bundle: true,
			write: false,
			platform: "browser"
		})
	)
		.outputFiles[0]
		.text;
};