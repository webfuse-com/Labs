import { join } from "path";
import { rmSync, readFileSync } from "fs";

import { Extension } from "../../tmp/api/Extension.js";
import { AssetBundler } from "../../tmp/api/AssetBundler.js";


const dirPath = join(import.meta.dirname, "./files/generated/a");
const srcPath = join(dirPath, "src");
const distPath = join(dirPath, "dist");

rmSync(dirPath, { recursive: true, force: true });


const extension = new Extension(
    srcPath,
    distPath,
    {
        type: "background",
        name: "foo",
    },
    {
        type: "popup",
        name: "bar",
        artifactsConfig: {
            js: { enabled: true, assetBundler: new AssetBundler(rawData => rawData + "...") },
            html: { enabled: true },
            css: { enabled: true }
        }
    },
);

const buildResult = await extension.bundle();

assertNotExists(
    join(distPath, "foo.js"),
    "Did emit extension component file to dist parent directory"
);

assertExists(
    join(distPath, "./foo/foo.js"),
    "Did not emit extension component file 'foo.js'"
);

assertNotExists(
    join(distPath, "./foo/foo.html"),
    "Did  emit extension component file 'foo.html'"
);

assertExists(
    join(distPath, "./bar/bar.js"),
    "Did not emit extension component file 'bar.js'"
);

assertExists(
    join(distPath, "./bar/bar.html"),
    "Did not emit extension component file 'bar.html'"
);

assertExists(
    join(distPath, "./bar/bar.css"),
    "Did not emit extension component file 'bar.css'"
);

assertEquals(
    readFileSync(join(distPath, "./foo/foo.js")).toString(),
    "",
    "Invalid emitted file contents for 'foo.js'"
);

assertEquals(
    readFileSync(join(distPath, "./bar/bar.js")).toString(),
    "...",
    "Invalid emitted file contents for 'bar.js'"
);

assertEquals(
    buildResult,
    [
        "./foo/foo.js",
        "./bar/bar.js",
        "./bar/bar.html",
        "./bar/bar.css",
        "./manifest.json"
    ]
        .map(fileName => join(distPath, fileName)),
    "Invalid build artifacts paths"
);