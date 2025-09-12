/*
 * Evaluates only in the Newtab.
 */

import { randomGreeting } from "#shared/shared.js";

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}