/**
 * Mapper classes realize bundler logic.
 * Bundlers represent data level transformers, including emit, but only if file was modified.
 */

import { readFile, writeFile, lstat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";

import { SRC_PATH, DIST_PATH } from "../../constants.js";


type TCbBundler = (data: string|string[], debug: boolean, path: string, ...args: unknown[]) => string|Promise<string>;

export class Bundler {
	static #lastTimestamp: number = -Infinity;
	static #fileCount: number = 0;

	static async fileModified(absoluteSrcPath: string) {
		const mtimeMs = (await lstat(absoluteSrcPath)).mtimeMs ?? Infinity;
		return (mtimeMs >= Bundler.#lastTimestamp);
	}

	static updateTimestamp() {
		this.#lastTimestamp = Date.now();
	}

	static flushFileCount(): number {
		const fileCount = Bundler.#fileCount;

		Bundler.#fileCount = 0;

		return fileCount;
	}

	static async emit(distPath: string, distContents: Buffer|string) {
		if(
			(typeof(distContents) === "string")
				? !distContents.trim()
				: !Buffer.byteLength(distContents)
		) return;

		const absoluteDistPath: string = join(DIST_PATH, distPath);

		await mkdir(dirname(absoluteDistPath), {
			recursive: true
		});
		await writeFile(absoluteDistPath, distContents);

		Bundler.#fileCount++;
	}

	#cb: TCbBundler;
	#binary: boolean;

	constructor(cb: TCbBundler, binary: boolean = false) {
		this.#cb = cb;
		this.#binary = binary;
	}

	// n-ary
	async apply(
		srcPaths: string|string[],
		distPath: string,
		debug: boolean = false,
		optional: boolean = true,
		force: boolean = false,
		...args: unknown[]
	) {
		if(!srcPaths) return false;

		const srcPathsList: string[] = [ srcPaths ].flat();
		distPath = distPath ?? srcPathsList[0];

		const absPath = (srcPath: string): string => resolve(SRC_PATH, srcPath);

		let applied: boolean = false;
		for(const srcPath of srcPathsList) {
			if(!srcPath) continue;

			const absoluteSrcPath = absPath(srcPath);
			if(!existsSync(absoluteSrcPath)) {
				if(optional) return;
				throw new ReferenceError(`Missing file ${srcPath}`);
			}
			if(!force && !(await Bundler.fileModified(absoluteSrcPath))) continue;

			const srcContents: string[] = await Promise.all(
				srcPathsList
                    .map(async (srcPath: string) => {
                    	if(!srcPath) return "";

                    	const srcContent: Buffer = await readFile(absPath(srcPath));
                    	return (!this.#binary ? srcContent.toString() : srcContent) as string;
                    })
			);
    
			const distContents: string = await this.#cb(
				(srcContents.length <= 1)
					? srcContents[0]
					: srcContents,
				debug, dirname(srcPath), ...args
			);

			await Bundler.emit(distPath, distContents);

			applied = true;

			break;
		}

		return applied;
	}
}