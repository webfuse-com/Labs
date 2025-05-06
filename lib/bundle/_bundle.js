import { readFile, cp } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import EventEmitter from "events";
import { SRC_PATH, DIST_PATH, TARGET_DIRS, STATIC_PATH, STATIC_DIR } from "../constants.js";
import { renderComponents } from "./sfc.js";
import { Bundler } from "./mappers/Bundler.js";
import { getAssetPath } from "../assets.js";
import { getPackage } from "../package.js";
import { converterSVG_16, converterSVG_32, converterSVG_64, converterSVG_128 } from "./bundlers/image.js";
import { bundlerSCSS, bundlerCSS, minifierCSS } from "./bundlers/css.js";
import { bundlerHTML } from "./bundlers/html.js";
import { bundlerTS, bundlerJS, minifierJS } from "./bundlers/js.js";
import { bundlerManifestJSON } from "./bundlers/json.js";
const WATCH_INTERVAL = 1000;
const readGlobal = async (ext) => {
    return (await readFile(getAssetPath("bundle", `globals/global.${ext}`)))
        .toString();
};
const globals = {
    css: await readGlobal("css"),
    jss: await readGlobal("js")
};
const sfcGlobal = await renderComponents(getAssetPath("bundle", "globals/components"), false, "webfuse-");
function cleanUp() {
    rmSync(DIST_PATH, {
        force: true,
        recursive: true
    });
    mkdirSync(DIST_PATH);
}
async function bundleAll(debug = false) {
    const t0 = performance.now();
    await converterSVG_16.apply("icon.svg", "icon/16.png", debug);
    await converterSVG_32.apply("icon.svg", "icon/32.png", debug);
    await converterSVG_64.apply("icon.svg", "icon/64.png", debug);
    await converterSVG_128.apply("icon.svg", "icon/128.png", debug);
    const srcPath = (path) => existsSync(join(SRC_PATH, path))
        ? path
        : null;
    const getSrcPath = (name, ext, path = ".") => {
        return srcPath(join(path, [name, ext].join(".")))
            || srcPath(join(path, ext, [name, ext].join(".")));
    };
    await bundlerManifestJSON.apply([
        getAssetPath("bundle", "manifest.json"),
        srcPath("../package.json"),
        srcPath("../.env")
    ], "manifest.json", debug);
    await bundlerTS.apply(getSrcPath("background", "ts"), "background.js", debug);
    await bundlerJS.apply(getSrcPath("background", "js"), "background.js", debug);
    await bundlerTS.apply(getSrcPath("content", "ts"), "content.js", debug);
    await bundlerJS.apply(getSrcPath("content", "js"), "content.js", debug);
    await bundlerTS.apply(getSrcPath("shared", "ts", "shared"), "shared.js", debug);
    await bundlerJS.apply(getSrcPath("shared", "js", "shared"), "shared.js", debug);
    let forceComponentRender = await bundlerSCSS.apply(getSrcPath("shared", "scss", "shared"), "shared.css", debug);
    forceComponentRender = await bundlerCSS.apply(getSrcPath("shared", "css", "shared"), "shared.css", debug) || forceComponentRender;
    const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"), forceComponentRender);
    await Promise.all(TARGET_DIRS
        .map(async (target) => {
        const getTargetSrcPath = (ext) => {
            return getSrcPath(target, ext, target);
        };
        const getDistPath = (ext) => [target, ext].join(".");
        const sfc = await renderComponents(join(SRC_PATH, target, "components"), forceComponentRender);
        const name = (await getPackage()).name ?? "";
        await bundlerHTML
            .apply(getTargetSrcPath("html"), getDistPath("html"), debug, true, (sfcShared.wasModified || sfc.wasModified), {
            name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
            target,
            sfcGlobal, sfcShared, sfc
        });
        await bundlerTS.apply(getTargetSrcPath("ts"), getDistPath("js"), debug);
        await bundlerJS.apply(getTargetSrcPath("js"), getDistPath("js"), debug);
        await bundlerSCSS.apply(getTargetSrcPath("scss"), getDistPath("css"), debug);
        await bundlerCSS.apply(getTargetSrcPath("css"), getDistPath("css"), debug);
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
export async function bundle(debug) {
    cleanUp();
    existsSync(STATIC_PATH)
        && await cp(STATIC_PATH, join(DIST_PATH, STATIC_DIR), { recursive: true });
    await Bundler.emit("global.css", await minifierCSS.apply(globals.css, debug));
    await Bundler.emit("global.js", await minifierJS.apply(globals.js, debug));
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
