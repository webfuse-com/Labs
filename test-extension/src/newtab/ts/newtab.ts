/*
 * Evaluates only in the Newtab.
 */

import { randomGreeting} from "#shared/shared.js";
import { sendMessage } from "./message";

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}

setTimeout(sendMessage, 1500);