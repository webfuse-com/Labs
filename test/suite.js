import { dir } from "console";
import { readdir } from "fs/promises";
import { join } from "path";


const files = [];
process.on("exit", code => {
    if(code) return;

    files.forEach(file => {
        console.log(`\x1b[2m/test/${file}...\x1b[22m \x1b[1m\x1b[32mdone\x1b[0m`);
    });
});


/**
 * Iterate all test files (*.test.js) for given suite (directory).
 */
export async function runSuite(name) {
    console.log("");

    (await readdir(join(import.meta.dirname, name), {
        withFileTypes: true
    }))
        .filter(dirent => dirent.isFile() && /\.test\.js/.test(dirent.name))
        .forEach(async dirent => {
            await import(join(dirent.parentPath, dirent.name));

            files.push(dirent.name);
        });
}


/**
 * Print test case failure in a neat way.
 * Print trace to test case.
 */
export async function catchError(assertion, errorMessage) {
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

    try { await assertion(); } catch(err) {
        console.error([
            `\x1b[1m\x1b[31mFailed Assertion\x1b[0m ${errorMessage ?? ""}`,
            `\x1b[2mat \x1b[22m${trace}\x1b[2m:\x1b[0m`,
            `\x1b[2mExpected: \x1b[36m${err.expected.toString()}\x1b[0m`,
            `\x1b[2mActual:\x1b[0m   \x1b[1m\x1b[36m${err.actual.toString()}\x1b[0m`,
            ""
        ].join("\n"));

        process.exit(1);
    }
}