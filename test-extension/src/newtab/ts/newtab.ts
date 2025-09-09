/*
 * Evaluates only in the Newtab.
 */

import { randomGreeting} from "#shared/shared.js";
import { sendMessage } from "./message";

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}

browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("> content");
    console.log("Received message:", msg);
    console.log("From:", sender);
});

setTimeout(sendMessage, 1500);