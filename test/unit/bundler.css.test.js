import { join } from "path";

import { bundlerCSS } from "../../tmp/api/bundlers/bundler.css.js";


function normalizeCSS(css) {
    return css
        .replace(/\s+/g, " ")
        .replace(/ *([{}:;]) */g, "$1")
        .trim();
}


assertEquals(
    normalizeCSS(
        await bundlerCSS.bundle(`
            @import "./_css.css";

            html {
                color: red;
            }
        `, join(import.meta.dirname, "files"))
    ),
    normalizeCSS(`
        body{ color: #0f0 }
        html{ color: red }
    `),
    "Invalid CSS bundle"
);