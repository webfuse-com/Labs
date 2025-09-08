export class Transpiler {
    #cb;
    constructor(cb) {
        this.#cb = cb;
    }
    async apply(contents = "", debug = false, ...args) {
        return this.#cb(contents, debug, ...args);
    }
}
