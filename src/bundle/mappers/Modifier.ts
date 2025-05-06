/**
 * Mapper classes realize bundler logic.
 * Modifiers represent data level transformers.
 */

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