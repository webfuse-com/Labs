/*
 * Evaluates only in the Newtab.
 */

import { sendMessage } from "./message";

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}

setTimeout(sendMessage, 1500);