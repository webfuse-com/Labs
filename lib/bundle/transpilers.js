import { join, normalize } from "path";
import { compileString as transpile_SCSS } from "sass";
import { build as esbuild } from "esbuild";
import { SRC_PATH } from "../constants.js";
export function transpileSCSS(scss) {
    return transpile_SCSS(scss).css;
}
export async function transpileModulesScript(code, loader, resolveDir) {
    return (await esbuild({
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
                    }, (args) => {
                        (normalize(join(args.resolveDir, args.path))
                            === normalize(join(SRC_PATH, "./shared/shared.js")))
                            && console.warn("Non-recommended use of imports from shared script module.");
                        return null;
                    });
                }
            }
        ]
    }))
        .outputFiles[0]
        .text;
}
;
