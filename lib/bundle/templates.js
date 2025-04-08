/**
 * Simple text templater.
 * Works with command syntax wrapped mark expressions.
 * Supported comment styles:
// HTML: <!-- @<MARK> -->
//   JS: /*   @<MARK   */

import { readFile } from "fs/promises";
import { join } from "path";


/**
 * Load a template from the /templates directory. 
 */
export async function load(name) {
    return (await readFile(
        join(import.meta.dirname, `templates/template.${name}.html`)
    )).toString();
}

/**
 * Apply templating in a given template.
 */
export function template(template, mark, value = "") {
    return template
        .replace(
            new RegExp(`(<!--|/\\*) *@${mark.toUpperCase()} *(-->|\\*/)`, "g"),
            value ?? ""
        );
}