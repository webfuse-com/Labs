/*
 * Evaluates only in the Newtab.
 */

window.sayHello = function(): void {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from Newtab.`;
}