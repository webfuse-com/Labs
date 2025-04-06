import { compileString as transpile_SCSS } from "sass";
import { transpileModule as transpile_TS } from "typescript";

import tsconfig from "./tsconfig.json" with { type: "json" };


export function transpileSCSS(scss) {
    return transpile_SCSS(scss).css;
}

export function transpileTS(ts) {
     const result = transpile_TS(ts, tsconfig);
    if (!result?.diagnostics.length) {
        return result.outputText;
    }

    throw new AggregateError(
        result.diagnostics
            .map(diagnostic => new Error(
                ts.flattenDiagnosticMessageText(diagnostic.messageText)
            )),
        "TS compiler errors"
    );
}