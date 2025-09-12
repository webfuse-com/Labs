/*
 * Evaluates only in the Popup.
 */

import { randomGreeting } from "#shared/shared.js";
import { NAME } from "./constants.js";

window.sayHello = function() {
    document.querySelector("p")
        .textContent = `${randomGreeting()} from ${NAME}.`;
}