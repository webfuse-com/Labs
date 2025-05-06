/**
 * Mapper classes realize bundler logic.
 * Bundlers represent data level transformers, including emit, but only if file was modified.
 */
import { readFile, writeFile, lstat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { SRC_PATH, DIST_PATH } from "../../constants.js";
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
    // n-ary
    async apply(srcPaths, distPath, debug = false, optional = true, force = false, ...args) {
        if (!srcPaths)
            return false;
        const srcPathsList = [srcPaths].flat();
        distPath = distPath ?? srcPathsList[0];
        const absPath = (srcPath) => resolve(SRC_PATH, srcPath);
        let applied = false;
        for (const srcPath of srcPathsList) {
            if (!srcPath)
                continue;
            const absoluteSrcPath = absPath(srcPath);
            if (!existsSync(absoluteSrcPath)) {
                console.log(absoluteSrcPath);
                console.log(absoluteSrcPath);
                if (optional)
                    return;
                throw new ReferenceError(`Missing file ${srcPath}`);
            }
            if (!force && !(await Bundler.fileModified(absoluteSrcPath)))
                continue;
            const srcContents = await Promise.all(srcPathsList
                .map(async (srcPath) => {
                if (!srcPath)
                    return "";
                const srcContent = await readFile(absPath(srcPath));
                return (!this.#binary ? srcContent.toString() : srcContent);
            }));
            const distContents = await this.#cb((srcContents.length <= 1)
                ? srcContents[0]
                : srcContents, debug, dirname(srcPath), ...args);
            await Bundler.emit(distPath, distContents);
            applied = true;
            break;
        }
        return applied;
    }
}
//# sourceMappingURL=Bundler.js.map