import { deepEqual, equal, ok } from "assert";

import { catchError, runSuite } from "./suite.js";
import { existsSync } from "fs";


global.assertEquals = (actual, expected, message) => {
    catchError(() => {
        deepEqual(actual, expected);
    }, message);
};

const assertIn = (actualPartial, expected, message, preserveWhitespace = false, isIn = true) => {
    const stripWhitespace = str => !preserveWhitespace
        ? str.replace(/\s{2,}/g, " ").trim()
        : str;
    catchError(() => {
        equal(stripWhitespace(expected).includes(stripWhitespace(actualPartial)), isIn);
    }, message);
};

global.assertIn = (actualPartials, expected, message, preserveWhitespace) => {
    [ actualPartials ]
        .flat()
        .forEach(actualPartial => {
            assertIn(actualPartial, expected, message, preserveWhitespace, true);
        });
};

global.assertNotIn = (actualPartial, expected, message, preserveWhitespace) => {
    assertIn(actualPartial, expected, message, preserveWhitespace, false);
};

global.assertExists = (path, message) => {
    catchError(() => {
        ok(existsSync(path));
    }, message);
};

global.assertNotExists = (path, message) => {
    catchError(() => {
        ok(!existsSync(path));
    }, message);
};


// Run suite
runSuite("unit");