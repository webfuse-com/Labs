import { join } from "path";
import { rmSync, readFileSync } from "fs";

import * as api from "../../tmp/api/api.js";


const dirPath = join(import.meta.dirname, "./files/a");
const distPath = join(dirPath, "dist");

rmSync(distPath, { recursive: true, force: true });


assertEquals(
    Object.keys(api),
    [
        "ExtensionBuilder",
        "createExtensionBuilder"
    ],
    "Invalid API signature"
);

await api.createExtensionBuilder(dirPath).build();

assertExists(
    dirPath,
    "Did not emit extension distributable"
);

assertExists(
    join(distPath, "background.js"),
    "Did not transpile TypeScript background script"
);

assertNotExists(
    join(distPath, "background.ts"),
    "Kept TypeScript background script"
);

assertIn(
    "console.log(\"foo\");",
    readFileSync(join(distPath, "background.js")).toString(),
    "Invalid emitted file contents for 'background.js'"
);

assertEquals(
    readFileSync(join(distPath, "content.js")).toString().length,
    0,
    "Invalid emitted file contents for 'content.js'"
);

assertIn(
    "console.log(\"bar\");",
    readFileSync(join(distPath, "newtab.js")).toString(),
    "Invalid emitted file contents for 'newtab.js'"
);

assertIn(
    [ "html", "body" ],
    readFileSync(join(distPath, "newtab.css")).toString(),
    "Invalid emitted file contents for 'newtab.css'"
);

assertIn(
    "console.log(\"baz\");",
    readFileSync(join(distPath, "popup.js")).toString(),
    "Invalid emitted file contents for 'popup.js'"
);

assertIn(
    [ "<html>", "<body>", "quux" ],
    readFileSync(join(distPath, "popup.html")).toString(),
    "Invalid emitted file contents for 'popup.html'"
);