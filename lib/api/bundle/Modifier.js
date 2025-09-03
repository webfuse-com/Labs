export class Modifier {
    #cb;
    constructor(cb) {
        this.#cb = cb;
    }
    async apply(contents = "", debug = false) {
        return this.#cb(contents, debug);
    }
}
