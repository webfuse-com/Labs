/**
 * Mapper classes realize bundler logic.
 * Modifiers represent data level transformers.
 */

type TCbModifier = (data: string, debug: boolean) => string|Promise<string>;

export class Modifier {
	#cb: TCbModifier;

	constructor(cb: TCbModifier) {
		this.#cb = cb;
	}

	async apply(contents: string = "", debug: boolean = false) {
		return this.#cb(contents, debug);
	}
}