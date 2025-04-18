/*
 * Evaluates only in the Newtab.
 */

function sayHello(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}