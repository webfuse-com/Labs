/*
 * Evaluates in both the Newtab, and the Popup.
 */

function randomGreeting() {
    return [ "Hello", "Hi", "Hoi" ]
        .sort(() => Math.round(Math.random()))
        .pop();
}