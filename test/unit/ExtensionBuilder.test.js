import { join } from "path";
import { rmSync, readFileSync } from "fs";

import { ExtensionBuilder } from "../../tmp/api/ExtensionBuilder.js";
import { AssetBundler } from "../../tmp/api/AssetBundler.js";


const dirPath = join(import.meta.dirname, "./files/generated/a");
const srcPath = join(dirPath, "src");
const distPath = join(dirPath, "dist");

rmSync(dirPath, { recursive: true, force: true });


const extensionBuilder = new ExtensionBuilder(
    srcPath,
    distPath,
    {
        name: "foo",
    },
    {
        name: "bar",
        artifactsConfig: {
            js: { enabled: true, assetBundler: new AssetBundler(rawData => rawData + "...") },
            html: { enabled: true },
            css: { enabled: true }
        }
    },
);

const buildResult = await extensionBuilder.build();

assertExists(
    join(distPath, "foo.js"),
    "Did not emit extension component file 'foo.js'"
);

assertNotExists(
    join(distPath, "foo.html"),
    "Did  emit extension component file 'foo.html'"
);

assertExists(
    join(distPath, "bar.js"),
    "Did not emit extension component file 'bar.js'"
);

assertExists(
    join(distPath, "bar.html"),
    "Did not emit extension component file 'bar.html'"
);

assertExists(
    join(distPath, "bar.css"),
    "Did not emit extension component file 'bar.css'"
);

assertEquals(
    readFileSync(join(distPath, "foo.js")).toString(),
    "",
    "Invalid emitted file contents for 'foo.js'"
);

assertEquals(
    readFileSync(join(distPath, "bar.js")).toString(),
    "...",
    "Invalid emitted file contents for 'bar.js'"
);

assertEquals(
    buildResult,
    [
        "foo.js",
        "bar.js",
        "bar.html",
        "bar.css"
    ]
        .map(fileName => join(distPath, fileName)),
    "Invalid build artifacts paths"
);