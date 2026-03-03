import { join } from "path";
import { rmSync, readFileSync } from "fs";

import * as api from "../../tmp/api/api.js";


const dirPath = join(import.meta.dirname, "./files/a");
const distPath = join(dirPath, "dist");

rmSync(distPath, { recursive: true, force: true });


assertEquals(
    Object.keys(api),
    [
        "Extension",
        "createExtension"
    ],
    "Invalid API signature"
);

await api.createExtension(dirPath).bundle();

assertExists(
    distPath,
    "Did not emit extension distributable"
);

assertExists(
    join(distPath, "manifest.json"),
    "Did not emit extension manifest"
);

assertExists(
    join(distPath, "icon"),
    "Did not emit icons directory"
);

assertExists(
    join(distPath, "./icon/32.png"),
    "Did not emit icon (32px)"
);

assertExists(
    join(distPath, "./background/background.js"),
    "Did not transpile TypeScript background script"
);

assertNotExists(
    join(distPath, "./background/background.ts"),
    "Kept TypeScript background script"
);

assertIn(
    "console.log(\"foo\");",
    readFileSync(join(distPath, "./background/background.js")).toString(),
    "Invalid emitted file contents for 'background.js'"
);

assertEquals(
    readFileSync(join(distPath, "./content/content.js")).toString().length,
    0,
    "Invalid emitted file contents for 'content.js'"
);

assertIn(
    "console.log(\"bar\");",
    readFileSync(join(distPath, "./newtab/newtab.js")).toString(),
    "Invalid emitted file contents for 'newtab.js'"
);

assertIn(
    [ "html", "body" ],
    readFileSync(join(distPath, "./newtab/newtab.css")).toString(),
    "Invalid emitted file contents for 'newtab.css'"
);

assertIn(
    "console.log(\"baz\");",
    readFileSync(join(distPath, "./popup/popup.js")).toString(),
    "Invalid emitted file contents for 'popup.js'"
);

assertIn(
    [ "<html>", "<body>", "quux" ],
    readFileSync(join(distPath, "/popup/popup.html")).toString(),
    "Invalid emitted file contents for 'popup.html'"
);

assertIn(
    [ "<html>", "<body>", "quux" ],
    readFileSync(join(distPath, "/popup/popup.html")).toString(),
    "Invalid emitted file contents for 'popup.html'"
);