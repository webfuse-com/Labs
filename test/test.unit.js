import { readFileSync } from "fs";
import { join } from "path";
import { deepEqual, equal } from "assert";

import { catchError, runSuite } from "./suite.js";


/**
 * Get file path from the test extension's dist directory (by relative path).
 */
global._path = name => {
    return join(import.meta.dirname, "../test-extension/dist/", name);
};

/**
 * Read a from the test extension's dist directory (by relative path).
 */
global._readDist = name => {
    return readFileSync(global._path(name)).toString();
};

/**
 * Assertion functions:
 * - assertEquals()
 * - assertIn()     ... string in string?
 * - assertNotIn()  ... string not in string?
 */

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

global.assertIn = (actualPartial, expected, message, preserveWhitespace) => {
    assertIn(actualPartial, expected, message, preserveWhitespace, true);
};

global.assertNotIn = (actualPartial, expected, message, preserveWhitespace) => {
    assertIn(actualPartial, expected, message, preserveWhitespace, false);
};


// Run suite
runSuite("unit");