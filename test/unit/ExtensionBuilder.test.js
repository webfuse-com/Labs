import { join } from "path";
import { readFileSync } from "fs";

import { ExtensionBuilder } from "../../tmp/api/ExtensionBuilder.js";
import { AssetBundler } from "../../tmp/api/AssetBundler.js";


const distPath = join(import.meta.dirname, "files", "dist");

const extensionBuilder = new ExtensionBuilder(
    join(import.meta.dirname, "files", "src"),
    distPath,
    {
        name: "foo",
    },
    {
        name: "bar",
        artifactsConfig: {
            js: { enabled: true, AssetBundler: new AssetBundler(rawData => rawData + "...") },
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