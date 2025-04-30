/**
 * Mapper classes to realize bundler logic.
 * Modifiers represent data level transformers.
 * Bundlers represent data level transformers, including emit, but only if file was modified.
 */

import { readFile, writeFile, lstat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";

import { SRC_PATH, DIST_PATH } from "../constants.js";


type TCbModifier = (data: string) => string|Promise<string>;

export class Modifier {
	#cb: TCbModifier;

	constructor(cb: TCbModifier) {
		this.#cb = cb;
	}

	async apply(contents: string = "", debug: boolean = false) {
		return !debug
			? this.#cb(contents)
			: contents;
	}
}

type TCbBundler = (data: string, debug: boolean, path: string, ...args: unknown[]) => string|Promise<string>;

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

	async apply(
		srcPath: string,
		distPath: string = srcPath,
		debug: boolean = false,
		optional: boolean = true,
		force: boolean = false,
		...args: unknown[]
	) {
		if(!srcPath) return false;

		const absoluteSrcPath = join(SRC_PATH, srcPath);
		if(!existsSync(absoluteSrcPath)) {
			if(optional) return;
			throw new ReferenceError(`Missing file ${srcPath}`);
		}

		if(!force && !(await Bundler.fileModified(absoluteSrcPath))) return false;

		const srcContents: Buffer = await readFile(absoluteSrcPath);
		const srcContentsAsStr = (!this.#binary ? srcContents.toString() : srcContents) as string;
		const distContents: string = await this.#cb(srcContentsAsStr, debug, dirname(srcPath), ...args);

		await Bundler.emit(distPath, distContents);

		return true;
	}
}
