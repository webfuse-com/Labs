import { readFile } from "fs/promises";
import { join } from "path";


export async function load(name) {
    return (await readFile(
        join(import.meta.dirname, `templates/template.${name}.html`)
    )).toString();
}

export function template(template, mark, value = "") {
    return template
        .replace(
            new RegExp(`(<!--|/\\*) *@${mark.toUpperCase()} *(-->|\\*/)`, "g"),
            value ?? ""
        );
}