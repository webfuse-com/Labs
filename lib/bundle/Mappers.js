import { readFile, writeFile, lstat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
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
        if ((typeof (distContents) === "string")
            ? !distContents.trim()
            : !Buffer.byteLength(distContents))
            return;
        const absoluteDistPath = join(DIST_PATH, distPath);
        await mkdir(dirname(absoluteDistPath), {
            recursive: true
        });
        await writeFile(absoluteDistPath, distContents);
        Bundler.#fileCount++;
    }
    #cb;
    #binary;
    constructor(cb, binary = false) {
        this.#cb = cb;
        this.#binary = binary;
    }
    async apply(srcPath, distPath = srcPath, debug = false, optional = true, force = false, ...args) {
        const absoluteSrcPath = join(SRC_PATH, srcPath);
        if (!existsSync(absoluteSrcPath)) {
            if (optional)
                return;
            throw new ReferenceError(`Missing file ${srcPath}`);
        }
        if (!force && !(await Bundler.fileModified(absoluteSrcPath)))
            return false;
        const srcContents = await readFile(absoluteSrcPath);
        const srcContentsAsStr = (!this.#binary ? srcContents.toString() : srcContents);
        const distContents = await this.#cb(srcContentsAsStr, debug, ...args);
        await Bundler.emit(distPath, distContents);
        return true;
    }
}
