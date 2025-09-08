import { GREETINGS } from "../constants.js";

export function getGreeting() {
    return GREETINGS
        .sort(() => Math.round(Math.random()))
        .pop();
}