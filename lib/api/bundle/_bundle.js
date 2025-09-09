/**
 * Bundle handler module.
 * Command invokes bundle().
 * Emits the extension project bundle.
 */
import { readFile, cp } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import EventEmitter from "events";
import { SRC_PATH, DIST_PATH, STATIC_PATH, STATIC_DIR } from "../../constants.js";
import { renderComponents } from "./sfc.js";
import { Bundler } from "./mapping/Bundler.js";
import { getAssetPath } from "../assets.js";
import { getPackage } from "../package.js";
import { converterSVG_16, converterSVG_32, converterSVG_64, converterSVG_128 } from "./mappers/image.js";
import { bundlerSCSS, bundlerCSS, minifierCSS } from "./mappers/style.js";
import { bundlerHTML } from "./mappers/markup.js";
import { bundlerJS, bundlerTS } from "./mappers/script.js";
import { bundlerManifestJSON } from "./mappers/json.js";
const RICH_DIRS = ["newtab", "popup", { name: "content", nestedOnly: false, applyAugmentation: true }];
const WATCH_INTERVAL = 1000;
const readGlobal = async (ext) => {
    return (await readFile(getAssetPath("bundle", `globals/global.${ext}`)))
        .toString();
};
/**
 * Global asset that affects all targets.
 */
const globals = {
    css: await readGlobal("css"),
};
/**
 * Global SFCs data.
 * Provides Webfuse components that can be reused across extensions for a consist UI.
 */
const sfcGlobal = await renderComponents(getAssetPath("bundle", "globals/components"), false, "webfuse-");
/**
 * Clean up by deleting the current bundle (/dist directory).
 */
function cleanUp() {
    rmSync(DIST_PATH, {
        force: true,
        recursive: true
    });
    mkdirSync(DIST_PATH);
}
/**
 * Emit the bundle from all relevant files in the extension directory.
 * Called from handler interface, which in turn contains one-time calls.
 */
async function bundleAll(debug = false) {
    const t0 = performance.now();
    await converterSVG_16.apply("icon.svg", "icon/16.png", debug);
    await converterSVG_32.apply("icon.svg", "icon/32.png", debug);
    await converterSVG_64.apply("icon.svg", "icon/64.png", debug);
    await converterSVG_128.apply("icon.svg", "icon/128.png", debug);
    const srcPath = (path) => existsSync(join(SRC_PATH, path))
        ? path
        : null;
    const getSrcPath = (name, ext, nestedOnly = false, subDir = ".") => {
        return srcPath(join(name, subDir, [name, ext].join(".")))
            || (!nestedOnly ? srcPath(join(subDir, [name, ext].join("."))) : null);
    };
    await bundlerManifestJSON.apply([
        getAssetPath("bundle", "manifest.json"),
        srcPath("../package.json"),
        srcPath("../.env")
    ], "manifest.json", debug);
    // TODO: Combine alternative switch in a single call
    await bundlerTS.apply(getSrcPath("background", "ts"), "background.js", debug);
    await bundlerJS.apply(getSrcPath("background", "js"), "background.js", debug); // prefer .js over .ts
    // await bundlerTS.apply(getSrcPath("shared", "ts", true), "shared.js", debug);
    // await bundlerJS.apply(getSrcPath("shared", "js", true), "shared.js", debug);	// prefer .js over .ts
    const forceComponentRender = (await bundlerSCSS.apply(getSrcPath("shared", "scss", true), "shared.css", debug)
        || await bundlerCSS.apply(getSrcPath("shared", "css", true), "shared.css", debug)).hasChanged; // prefer .css over .scss
    const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"), forceComponentRender);
    await Promise.all(RICH_DIRS
        .map((target) => {
        return (typeof (target) === "string")
            ? {
                name: target,
                nestedOnly: true,
                applyAugmentation: false
            }
            : target;
    })
        .map(async (targetObj) => {
        const getTargetSrcPath = (ext, subDir = ".") => {
            return getSrcPath(targetObj.name, ext, targetObj.nestedOnly, subDir);
        };
        const getDistPath = (ext) => [targetObj.name, ext].join(".");
        const sfc = await renderComponents(join(SRC_PATH, targetObj.name, "components"), forceComponentRender);
        const name = (await getPackage()).name ?? "";
        const html = (await bundlerHTML
            .apply(getTargetSrcPath("html", targetObj.applyAugmentation ? "augmentation" : ""), getDistPath("html"), debug, targetObj.nestedOnly, (sfcShared.wasModified || sfc.wasModified), {
            name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
            target: targetObj.name,
            sfcGlobal, sfcShared, sfc
        })).data;
        const css = [
            await bundlerSCSS.apply(getTargetSrcPath("scss", targetObj.applyAugmentation ? "augmentation" : ""), getDistPath("css"), debug),
            await bundlerSCSS.apply(getTargetSrcPath("css", targetObj.applyAugmentation ? "augmentation" : ""), getDistPath("css"), debug), // prefer .css over .scss`
        ]
            .find((css) => css?.data)
            ?.data;
        const renderScript = (ext, subDir = ".") => {
            return (ext === "ts" ? bundlerTS : bundlerJS)
                .apply(getTargetSrcPath(ext, subDir), getDistPath("js"), debug, true, false, targetObj.applyAugmentation
                ? {
                    html,
                    css
                } : null);
        };
        await renderScript("ts", "ts");
        await renderScript("ts"); // prefer target level over lang-scoped
        await renderScript("js", "js");
        await renderScript("js"); // prefer .js over .ts
    }));
    const fileCount = Bundler.flushFileCount();
    fileCount
        && Bundler.updateTimestamp();
    return {
        src: SRC_PATH,
        dist: DIST_PATH,
        count: fileCount,
        ms: (performance.now() - t0).toPrecision(3)
    };
}
/**
 * CLI command handler interface.
 * Invoked from entry module.
 */
export async function bundle(debug) {
    cleanUp();
    existsSync(STATIC_PATH)
        && await cp(STATIC_PATH, join(DIST_PATH, STATIC_DIR), { recursive: true });
    await Bundler.emit("global.css", await minifierCSS.apply(globals.css, debug));
    // await Bundler.emit("global.js", await minifierJS.apply(globals.js, debug));
    // Expose event emitter to allow listening to bundleAll() calls.
    const emitter = new EventEmitter();
    const run = async () => {
        const stats = await bundleAll(debug);
        stats.count
            && setImmediate(() => emitter.emit("bundle", stats));
        setTimeout(run, WATCH_INTERVAL);
    };
    setImmediate(run);
    return emitter;
}
//# sourceMappingURL=_bundle.js.map