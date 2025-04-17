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


// Start actual browser for user end tests
const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: process.argv.slice(2).includes("--headless"),
    args: [ `--window-size=${_config.width + 20},${_config.height + 160}` ]
});

const page = (await browser.pages())[0];
await page.goto("http://localhost:5000");
await page.setViewport({ width: _config.width, height: _config.height });


let openCases = 0;
let terminationTimeout;
const extendTerminationTimeout = (ms = _config.terminationTimeoutMs) => {
    clearTimeout(terminationTimeout);
    setTimeout(() => {
        console.error("Test suite timed out");
        process.exit(openCases ? 1 : 0);
    }, ms);
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

global.assertTabs = (count, message) => {
    wrapCase(async () => {
        equal((await browser.pages()).length, count);
    }, message);
};

/**
 * Perform an action sequence in the page.
 * This is, dispatch interaction events on elements (e.g. a click()).
 * Each completed seuqence is followed by a page reload to reset its state.
 */
const sequenceAPI = {
    _click: targetSelector => {
        return new Promise(async resolve => {
            await page.evaluate(`document.querySelector("${targetSelector}").click()`);

            setTimeout(resolve, 250);
        });
    }
};

global._sequence = async cb => {
    extendTerminationTimeout();

    await new Promise(resolve => {
        setTimeout(async () => {
            await cb(sequenceAPI);

            setImmediate(async () => {
                await page.reload();

                resolve();
            });
        }, 50);
    });
};


// Run suite
extendTerminationTimeout();

await runSuite("end-to-end");