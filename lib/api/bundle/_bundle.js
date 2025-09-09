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
const globals = {
    css: await readGlobal("css"),
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
    const getSrcPath = (name, ext, nestedOnly = false, subDir = ".") => {
        return srcPath(join(name, subDir, [name, ext].join(".")))
            || (!nestedOnly ? srcPath(join(subDir, [name, ext].join("."))) : null);
    };
    await bundlerManifestJSON.apply([
        getAssetPath("bundle", "manifest.json"),
        srcPath("../package.json"),
        srcPath("../.env")
    ], "manifest.json", debug);
    await bundlerTS.apply(getSrcPath("background", "ts"), "background.js", debug);
    await bundlerJS.apply(getSrcPath("background", "js"), "background.js", debug);
    const forceComponentRender = (await bundlerSCSS.apply(getSrcPath("shared", "scss", true), "shared.css", debug)
        || await bundlerCSS.apply(getSrcPath("shared", "css", true), "shared.css", debug)).hasChanged;
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
            await bundlerSCSS.apply(getTargetSrcPath("css", targetObj.applyAugmentation ? "augmentation" : ""), getDistPath("css"), debug),
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
        await renderScript("ts");
        await renderScript("js", "js");
        await renderScript("js");
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
