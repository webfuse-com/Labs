/**
 * Mapper classes realize bundler logic.
 * Transpilers represent data level transformers, including modifiers.
 */

type TCbTranspiler = (data: string, debug: boolean, ...args: unknown[]) => string|Promise<string>;

export class Transpiler {
	#cb: TCbTranspiler;

	constructor(cb: TCbTranspiler) {
		this.#cb = cb;
	}

	async apply(contents: string = "", debug: boolean = false, ...args: unknown[]) {
		return this.#cb(contents, debug, ...args);
	}
}