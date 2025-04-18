/**
 * Simple text templater.
 * Works with command syntax wrapped mark expressions.
 * Supported comment styles:
// HTML: <!-- @<MARK> -->
//   JS: /*   @<MARK   */

import { readFile } from "fs/promises";

import { getAssetPath } from "../assets.js";


/**
 * Load a template from the /templates directory. 
 */
export async function load(name: string): Promise<string> {
    return (await readFile(
        getAssetPath("bundle", `templates/template.${name}.html`)
    )).toString();
}

/**
 * Apply templating in a given template.
 */
export function template(template: string, mark: string, value: string = ""): string {
    return template
        .replace(
            new RegExp(`(<!--|/\\*) *@${mark.toUpperCase()} *(-->|\\*/)`, "g"),
            value ?? ""
        );
}