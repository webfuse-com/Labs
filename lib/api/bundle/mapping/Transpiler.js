/**
 * Mapper classes realize bundler logic.
 * Transpilers represent data level transformers, including modifiers.
 */
export class Transpiler {
    #cb;
    constructor(cb) {
        this.#cb = cb;
    }
    async apply(contents = "", debug = false, ...args) {
        return this.#cb(contents, debug, ...args);
    }
}
//# sourceMappingURL=Transpiler.js.map