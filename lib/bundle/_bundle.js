import { readFile, cp } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import HTMLMinifier from "html-minifier";
import CSSMinifier from "clean-css";
import JSMinifier from "uglify-js";
import { ROOT_PATH, SRC_PATH, DIST_PATH, TARGET_DIRS, STATIC_PATH, STATIC_DIR } from "../constants.js";
import { load as loadTemplate, template } from "./templates.js";
import { renderComponents } from "./sfc.js";
import { getAssetPath } from "../assets.js";
import manifest from "./manifest.json" with { type: "json" };
import EventEmitter from "events";
import { Modifier, Bundler } from "./Mappers.js";
import { transpileSCSS, transpileTS } from "./transpilers.js";
const WATCH_INTERVAL = 1000;
const MARKUP_TEMPLATE = await loadTemplate("markup");
const minifierHTML = new Modifier(html => HTMLMinifier.minify(html, {
    minifyJS: true,
    minifyCSS: true,
    collapseWhitespace: true
}));
const minifierCSS = new Modifier(css => new CSSMinifier().minify(css).styles);
const minifierJS = new Modifier(js => JSMinifier.minify(js).code);
const formatterHTML = new Modifier(html => prettier.format(html, {
    parser: "html"
}));
const bundlerHTML = new Bundler(async (html, debug, options) => {
    let renderedHtml = MARKUP_TEMPLATE;
    renderedHtml = template(renderedHtml, "NAME", options.name);
    renderedHtml = template(renderedHtml, "TARGET", options.target);
    renderedHtml = template(renderedHtml, "GLOBAL_SFC_HTML", options.sfcGlobal.data.join("\n"));
    renderedHtml = template(renderedHtml, "SHARED_SFC_HTML", options.sfcShared.data.join("\n"));
    renderedHtml = template(renderedHtml, "SFC_HTML", options.sfc.data.join("\n"));
    renderedHtml = template(renderedHtml, "HTML", html);
    return minifierHTML
        .apply(await formatterHTML.apply(renderedHtml), debug);
});
const bundlerCSS = new Bundler((css, debug) => {
    return minifierCSS.apply(css, debug);
});
const bundlerSCSS = new Bundler((scss, debug) => {
    return minifierCSS.apply(transpileSCSS(scss), debug);
});
const bundlerJS = new Bundler((js, debug) => {
    return minifierJS.apply(js, debug);
});
const bundlerTS = new Bundler((ts, debug) => {
    return minifierJS.apply(transpileTS(ts), debug);
});
const getPackage = async () => {
    const packageJsonPath = join(ROOT_PATH, "package.json");
    return existsSync(packageJsonPath)
        ? (await import(packageJsonPath, { with: { type: "json" } })).default
        : {};
};
const readGlobal = async (ext) => {
    return (await readFile(getAssetPath("bundle", `globals/global.${ext}`)))
        .toString();
};
const globals = {
    css: await readGlobal("css"),
    jss: await readGlobal("js")
};
const sfcGlobal = await renderComponents(getAssetPath("bundle", "globals/components"), "webfuse-");
function cleanUp() {
    rmSync(DIST_PATH, {
        force: true,
        recursive: true
    });
    mkdirSync(DIST_PATH);
}
async function bundleAll(debug = false) {
    const t0 = performance.now();
    await bundlerTS.apply("background.ts", undefined, debug);
    await bundlerJS.apply("background.js", undefined, debug);
    await bundlerTS.apply("content.ts", undefined, debug);
    await bundlerJS.apply("content.js", undefined, debug);
    await bundlerTS.apply("shared/shared.ts", "shared.js", debug);
    await bundlerJS.apply("shared/shared.js", "shared.js", debug);
    await bundlerSCSS.apply("shared/shared.scss", "shared.css", debug);
    await bundlerCSS.apply("shared/shared.css", "shared.css", debug);
    const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"));
    await Promise.all(TARGET_DIRS
        .map(async (target) => {
        const getSrcPath = (ext) => [join(target, target), ext].join(".");
        const getDistPath = (ext) => [target, ext].join(".");
        const sfc = await renderComponents(join(SRC_PATH, target, "components"), "webfuse-");
        const name = (await getPackage()).name ?? "";
        await bundlerHTML
            .apply(getSrcPath("html"), getDistPath("html"), debug, true, (sfcShared.wasModified || sfc.wasModified), {
            name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
            target,
            sfcGlobal, sfcShared, sfc
        });
        await bundlerTS.apply(getSrcPath("ts"), getDistPath("js"), debug);
        await bundlerJS.apply(getSrcPath("js"), getDistPath("js"), debug);
        await bundlerSCSS.apply(getSrcPath("scss"), getDistPath("css"), debug);
        await bundlerCSS.apply(getSrcPath("css"), getDistPath("css"), debug);
    }));
    const fileCount = Bundler.flushFileCount();
    fileCount && Bundler.updateTimestamp();
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
    const packageObj = await getPackage();
    const manifestObj = Object.assign({}, manifest);
    manifestObj.name = packageObj.name ?? "extension";
    manifestObj.version = packageObj.version ?? "1.0";
    await Bundler.emit("manifest.json", JSON.stringify(manifestObj, null, debug ? 2 : undefined));
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
