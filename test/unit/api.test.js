import * as api from "../../tmp/api/api.js";


assertEquals(
    Object.keys(api),
    [
        "createExtensionBuilder"
    ],
    "Invalid API signature"
);