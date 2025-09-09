/*
 * Evaluates only in the Newtab.
 */

import { randomGreeting} from "#shared/shared.js";
import { sendMessage } from "./message";

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}

browser.runtime.onMessage.addListener((message, sender) => {
    console.log(`Received message from ${sender.url} in newtab:`, {
        message,
        sender
    });
});

setTimeout(sendMessage, 1500);