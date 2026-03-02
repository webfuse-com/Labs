import { join } from "path";

import { ExtensionBuilder } from "../../src/api/ExtensionBuilder.ts";


const distPath = join(import.meta.dirname, "files", "dist");

const extensionBuilder = new ExtensionBuilder(
    join(import.meta.dirname, "files", "src"),
    distPath,
    {
        name: "foo"
    },
    {
        name: "bar",
        artifactsConfig: {
            html: true,
            js: true,
            css: true
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