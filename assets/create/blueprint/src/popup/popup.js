/*
 * Evaluates only in the Popup.
 */

function sayHello() {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Popup.`;
}