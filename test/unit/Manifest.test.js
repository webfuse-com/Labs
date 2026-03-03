import { join } from "path";

import { Manifest } from "../../tmp/api/Manifest.js";


const extensionPath = join(import.meta.dirname, "./files/extension");

const manifest = new Manifest(extensionPath);

const expectedDefaultObject = {
    manifest_version: 3,
    host_permissions:[ "<all_urls>" ],
    content_scripts: [],
    icons: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "64": "icon/64.png",
        "128": "icon/128.png"
    },
    // updated part:
    name: "@webfuse-com/example",
    version: "0.8.15"
};

assertEquals(
    JSON.stringify(await manifest.toObject()),
    JSON.stringify(expectedDefaultObject),
    "Invalid default manifest object"
);

assertEquals(
    await manifest.toString(),
    JSON.stringify(expectedDefaultObject, null, 2),
    "Invalid default manifest string"
);

manifest.addBackgroundScript("./foo/bar.js");
manifest.addContentScript("./baz/qux/quux.js");
manifest.addPopupMarkup("./corge.html");
manifest.addNewtabMarkup("./grault/garply.html");

const expectedComponentsObject = {
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
};

assertEquals(
    JSON.stringify(await manifest.toObject()),
    JSON.stringify({
        ...expectedDefaultObject,
        ...expectedComponentsObject
    }),
    "Invalid manifest object after component file definition"
);


manifest.addEnv({
    foo: "bar",
    baz: "quux"
});

assertEquals(
    JSON.stringify(await manifest.toObject()),
    JSON.stringify({
        ...expectedDefaultObject,
        ...expectedComponentsObject,

        env: {
            foo: "bar",
            baz: "quux"
        }
    }),
    "Invalid manifest object after component file definition"
);