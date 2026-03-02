import { join } from "path";

import { bundlerTS } from "../../tmp/api/bundlers/bundler.ts.js";


function normalizeTS(ts) {
    return ts
        .replace(/\s+/g, "")
        .trim();
}

const tsBundle = await bundlerTS.bundle(
    `
        import { foo } from "./_ts.ts";

        console.log(foo());
    `,
    join(import.meta.dirname, "files")
);

assertIn(
    normalizeTS(`
        return "bar"
    `),
    normalizeTS(tsBundle),
    "Invalid TS bundle"
);

assertIn(
    normalizeTS(`
        console.log
    `),
    normalizeTS(tsBundle),
    "Invalid TS bundle"
);