/*
 * Evaluates only in the Newtab.
 */

function sayHello(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}

setTimeout(() => {
    browser.tabs.sendMessage(0, {
        from: "newtab"
    });
}, 1500);