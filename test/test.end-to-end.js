import { join } from "path";
import { equal } from "assert";

import puppeteer from "puppeteer";

import { catchError, runSuite } from "./suite.js";


const _config = {
    width: 1200,
    height: 800,
    terminationTimeoutMs: 2000
};


// Change to test extension directory and spin up preview
process.chdir(join(import.meta.dirname, "../test-extension"));
await (await import("../lib/preview/_preview.js")).preview();
console.log("\x1b[2mPreview application running...\x1b[0m");
process.on("exit", () => {
    console.log("\x1b[2mPreview application terminated.\x1b[0m");
});


// Start actual browser for user end tests
const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: process.argv.slice(2).includes("--headless"),
    args: [ `--window-size=${_config.width + 20},${_config.height + 160}` ]
});

const page = (await browser.pages())[0];
const pageRes = await page.goto("http://localhost:5000");
if(pageRes.status() !== 200)
    throw new ReferenceError("Preview not available");
await page.setViewport({ width: _config.width, height: _config.height });


let openCases = 0;
let terminationTimeout;
const extendTerminationTimeout = (ms = _config.terminationTimeoutMs) => {
    clearTimeout(terminationTimeout);
    terminationTimeout = setTimeout(() => {
        console.error("Test suite timed out");

        process.exit(openCases ? 1 : 0);
    }, openCases ? ms : 500);
};


const wrapCase = (caseCb, message) => {
    openCases++;

    catchError(async () => {
        await caseCb();

        openCases--;

        extendTerminationTimeout();
    }, message);
};


/**
 * Assertion functions:
 * - assertExists() ... element exists in DOM (by query selector)
 */

const querySelector = selector => {
    return new Promise(async resolve => {
        setTimeout(() => resolve(null), 500);
        resolve((await page.waitForSelector(selector)).handle);
    });
};

global.assertExists = (selector, message) => {
    wrapCase(async () => {
        equal(!!querySelector(selector), true);
    }, message);
};

global.assertAttr = (selector, attrName, attrValue, message) => {
    wrapCase(async () => {
        const value = await page.evaluate(`document.querySelector("${selector}").getAttribute("${attrName}")`);
        equal(value, attrValue);
    }, message);
};


// Run suite
extendTerminationTimeout();

await runSuite("end-to-end");