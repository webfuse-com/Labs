/*
 * Evaluates only in the Popup.
 */

import { randomGreeting} from "#shared/shared.js";

window.sayHello = function() {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Popup.`;
}

browser.runtime.onMessage.addListener((message, sender) => {
    console.log(`Received message from ${sender.url} in popup:`, {
        message,
        sender
    });
});

browser.runtime
    .sendMessage({
        from: "newtab"
    });

browser.tabs
    .sendMessage(0, {
        from: "newtab"
    });