/*
 * Evaluates in both the Newtab, and the Popup.
 */

export function randomGreeting() {
    return [ "Hello", "Hi", "Hoi" ]
        .sort(() => Math.round(Math.random()))[0];
}