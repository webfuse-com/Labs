import { readFile } from "fs/promises";
import { getAssetPath } from "../assets.js";
export async function load(name) {
    return (await readFile(getAssetPath("bundle", `templates/template.${name}.html`))).toString();
}
export function template(template, mark, value = "") {
    return template
        .replace(new RegExp(`(<!--|/\\*) *@${mark.toUpperCase()} *(-->|\\*/)`, "g"), value ?? "");
}
