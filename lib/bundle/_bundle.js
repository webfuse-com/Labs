import { readFile } from "fs/promises";
import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

import * as prettier from "prettier";
import HTMLMinifier from "html-minifier";
import CSSMinifier from "clean-css";
import JSMinifier from "uglify-js";

import { ROOT_PATH, SRC_PATH, DIST_PATH } from "../constants.js";
import { load as loadTemplate, template } from "./templates.js";
import { renderComponents } from "./sfc.js";

import manifest from "./manifest.json" with { type: "json" };
import EventEmitter from "events";
import { Modifier, Bundler } from "./Mappers.js";
import { transpileSCSS, transpileTS } from "./transpilers.js";


// TODO: Unopinionated mode
// TODO: Target assets (/assets)
// TODO: Extension env (.env?)
// TODO: background.js and content.js constraints (scope)


const WATCH_INTERVAL = 1000;
const TARGET_DIRS = [ "newtab", "popup" ];
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


const bundlerHTML = new Bundler(async (html, debug, options = {}) => {
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
}

const readGlobal = async ext => {
    return (await readFile(join(import.meta.dirname, `globals/global.${ext}`)))
        .toString();
};

const globals = {
    css: await readGlobal("css"),
    jss: await readGlobal("js")
};

const sfcGlobal = await renderComponents(join(import.meta.dirname, "globals/components"), "webfuse-");


function cleanUp() {
    rmSync(DIST_PATH, {
        force: true,
        recursive: true
    });
    mkdirSync(DIST_PATH);
}

async function bundleAll(debug) {
    const t0 = performance.now();

    await bundlerTS.apply("background.ts", undefined, debug);
    await bundlerJS.apply("background.js", undefined, debug); // prefer .js over .ts
    await bundlerTS.apply("content.ts", undefined, debug);
    await bundlerJS.apply("content.js", undefined, debug);    // prefer .js over .ts

    await bundlerTS.apply("shared/shared.ts", "shared.js", debug);
    await bundlerJS.apply("shared/shared.js", "shared.js", debug);      // prefer .js over .ts
    await bundlerSCSS.apply("shared/shared.scss", "shared.css", debug);
    await bundlerCSS.apply("shared/shared.css", "shared.css", debug);   // prefer .css over .scss

    const sfcShared = await renderComponents(join(SRC_PATH, "shared/components"));

    await Promise.all(TARGET_DIRS
        .map(async target => {
            const getSrcPath = ext => [ join(target, target), ext ].join(".");
            const getDistPath = ext => [ target, ext ].join(".");

            const sfc = await renderComponents(join(SRC_PATH, target, "components"), "webfuse-");
            const name = (await getPackage()).name;

            await bundlerHTML
                .apply(getSrcPath("html"), getDistPath("html"), debug, true, (sfcShared.wasModified || sfc.wasModified), {
                    name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
                    target,
                    sfcGlobal, sfcShared, sfc
                });
            await bundlerTS.apply(getSrcPath("ts"), getDistPath("js"), debug);
            await bundlerJS.apply(getSrcPath("js"), getDistPath("js"), debug);      // prefer .js over .ts
            await bundlerSCSS.apply(getSrcPath("scss"), getDistPath("css"), debug);
            await bundlerCSS.apply(getSrcPath("css"), getDistPath("css"), debug);   // prefer .css over .scss
        }));

    const fileCount = Bundler.flushFileCount();
    fileCount & Bundler.updateTimestamp();

    return {
        src: SRC_PATH,
        dist: DIST_PATH,
        count: fileCount,
        ms: (performance.now() - t0).toPrecision(3)
    };
}


export async function bundle(debug = false) {
    cleanUp();

    const packageObj = await getPackage();
    manifest.name = packageObj.name ?? "";
    manifest.version = packageObj.version ?? "1.0";
    await Bundler.emit("manifest.json", JSON.stringify(manifest, null, debug ? 2 : undefined));

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