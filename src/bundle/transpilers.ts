/**
 * Transpiler utilities abstracting framework-specific configuration.
 */

import { compileString as transpile_SCSS } from "sass";
import { TranspileOptions, transpileModule as transpile_TS, flattenDiagnosticMessageText } from "typescript";

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