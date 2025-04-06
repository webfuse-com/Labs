import { readFile, writeFile, lstat } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

import { SRC_PATH, DIST_PATH } from "../constants.js";


export class Modifier {
    #cb;

    constructor(cb) {
        this.#cb = cb;
    }

    async apply(contents = "", debug = false) {
        return !debug
            ? this.#cb(contents)
            : contents;
    }
}

export class Bundler {
    static #lastTimestamp = -Infinity;
    static #fileCount = 0;

    static async fileModified(absoluteSrcPath) {
        const mtimeMs = (await lstat(absoluteSrcPath)).mtimeMs ?? Infinity;
        return (mtimeMs >= Bundler.#lastTimestamp);
    }

    static updateTimestamp() {
        this.#lastTimestamp = Date.now();
    }

    static flushFileCount() {
        const fileCount = Bundler.#fileCount;

        Bundler.#fileCount = 0;

        return fileCount;
    }

    static async emit(distPath, distContents) {
        if(!distContents.trim()) return;

        const absoluteDistPath = join(DIST_PATH, distPath);

        await writeFile(absoluteDistPath, distContents);

        Bundler.#fileCount++;
    }

    #cb;

    constructor(cb) {
        this.#cb = cb;
    }

    async apply(srcPath, distPath = srcPath, debug = false, optional = true, force = false, ...args) {
        const absoluteSrcPath = join(SRC_PATH, srcPath);
        if(!existsSync(absoluteSrcPath)) {
            if(optional) return;
            throw new ReferenceError(`Missing file ${srcPath}`);
        }

        if(!force && !(await Bundler.fileModified(absoluteSrcPath))) return;

        const srcContents = await readFile(absoluteSrcPath);
        const distContents = await this.#cb(srcContents.toString(), debug, ...args);

        await Bundler.emit(distPath, distContents);
    }
}
