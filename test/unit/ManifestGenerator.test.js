import { join } from "path";

import { ManifestGenerator } from "../../tmp/api/ManifestGenerator.js";


const extensionPath = join(import.meta.dirname, "./files/extension");

const manifestGenerator = new ManifestGenerator(extensionPath);

const expectedDefaultObject = {
    manifest_version: 3,
    content_scripts: [],
    name: "@webfuse-com/example",
    version: "0.8.15"
};

assertEquals(
    JSON.stringify(await manifestGenerator.toObject()),
    JSON.stringify(expectedDefaultObject),
    "Invalid default manifest object"
);

assertEquals(
    await manifestGenerator.toString(),
    JSON.stringify(expectedDefaultObject, null, 2),
    "Invalid default manifest string"
);

manifestGenerator.addBackgroundScript("./foo/bar.js");
manifestGenerator.addContentScript("./baz/qux/quux.js");
manifestGenerator.addPopupMarkup("./corge.html");
manifestGenerator.addNewtabMarkup("./grault/garply.html");

assertEquals(
    JSON.stringify(await manifestGenerator.toObject()),
    JSON.stringify({
        ...expectedDefaultObject,

        content_scripts: [
            {
                js: [ "baz/qux/quux.js" ],
                matches: [ "<all_urls>" ]
            }
        ],
        background: {
            service_worker: "foo/bar.js"
        },
        action: {
            default_popup: "corge.html"
        },
        chrome_url_overrides: {
            newtab: "grault/garply.html"
        }
    }),
    "Invalid manifest object after component file definition"
);