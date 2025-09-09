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
export async function load(name, extension = "html") {
    return (await readFile(getAssetPath("bundle", `templates/template.${name}.${extension}`))).toString();
}
/**
 * Apply templating in a given template.
 */
export function template(template, mark, value = "") {
    return template
        .replace(new RegExp(`(<!--|/\\*) *@${mark.toUpperCase()} *(-->|\\*/)`, "g"), value ?? "");
}
//# sourceMappingURL=templates.js.map