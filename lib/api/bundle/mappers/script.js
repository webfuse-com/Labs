import { readFileSync } from "fs";
import { join, normalize } from "path";
import JSMinifier from "uglify-js";
import { build as esbuild } from "esbuild";
import { SRC_PATH } from "../../../constants.js";
import { Bundler } from "../Bundler.js";
import { Transpiler } from "../Transpiler.js";
const ENHANCED_API = readFileSync(join(import.meta.dirname, "../../../enhanced-browser-api.js")).toString();
const createScriptBundler = (loader, enhanceBrowserAPI = false) => {
    return new Bundler(async (script, debug, path) => {
        return minifierJS.apply(enhanceBrowserAPI
            ? await transpilerScripts.apply(script, null, loader, join(SRC_PATH, path))
            : script, debug);
    });
};
export const bundlerJS = createScriptBundler("js");
export const bundlerComponentJS = createScriptBundler("js", true);
export const bundlerTS = createScriptBundler("ts");
export const bundlerComponentTS = createScriptBundler("ts", true);
export const transpilerScripts = new Transpiler(async (code, _, loader, resolveDir) => {
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
});
export const minifierJS = new Transpiler((js, debug) => {
    return !debug
        ? JSMinifier.minify(js).code
        : js;
});
export const apiEnhanceJS = new Transpiler(js => {
    return [
        ENHANCED_API,
        js
    ].join("\n");
});
