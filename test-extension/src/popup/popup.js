/*
 * Evaluates only in the Popup.
 */

import { randomGreeting} from "#shared/shared.js";

window.sayHello = function() {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Popup.`;
}

browser.runtime.onMessage
    .addListener((msg, sender) => {
        console.log("Received message:", msg);
        console.log("From:", sender);
    });