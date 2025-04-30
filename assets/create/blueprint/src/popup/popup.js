/*
 * Evaluates only in the Popup.
 */

import { NAME } from "./js/constants";

window.sayHello = function() {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from ${NAME}.`;
}