/*
 * Evaluates in both the Newtab, and the Popup.
 */

window.randomGreeting = function() {
    return [ "Hello", "Hi", "Hoi" ]
        .sort(() => Math.round(Math.random()))
        .pop();
}