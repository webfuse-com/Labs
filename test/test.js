import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { deepEqual, equal } from "assert";


global._readDist = (name) => {
    return readFileSync(join(import.meta.dirname, "../test-extension/dist/", name)).toString();
};

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


const catchError = (assertion, errorMessage) => {
    const trace = (
        ((new Error()).stack ?? "")
            .split(/\n/g)
            .filter(line => /\.test\.js/.test(line))
            .shift()
        ?? "")
            .split(/\s+/)
            .pop()
            .replace(/^file:\/\//, "")
            .replace(/\)$/, "");

    try { assertion() } catch(err) {
        console.error([
            `\x1b[1m\x1b[31mFailed Assertion\x1b[0m ${errorMessage ?? ""}`,
            `\x1b[2mat \x1b[22m${trace}\x1b[2m:\x1b[0m`,
            `\x1b[2mExpected: \x1b[36m${err.expected.toString()}\x1b[0m`,
            `\x1b[2mActual:\x1b[0m   \x1b[1m\x1b[36m${err.actual.toString()}\x1b[0m`,
            ""
        ].join("\n"));

        process.exit(1);
    }
};


console.log("");
(await readdir(import.meta.dirname, {
    withFileTypes: true
}))
    .filter(dirent => dirent.isFile() && /\.test\.js/.test(dirent.name))
    .forEach(async dirent => {
        await import(join(dirent.parentPath, dirent.name));

        console.log(`\x1b[2m/test/${dirent.name}...\x1b[22m \x1b[1m\x1b[32mdone\x1b[0m`);
    });