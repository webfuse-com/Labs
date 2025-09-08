import { existsSync } from "fs";
import { dirname, extname, join } from "path";
import { readdir, readFile } from "fs/promises";
import { createHash } from "crypto";
import { parse } from "node-html-parser";
import { Bundler } from "./Bundler.js";
import { transpilerSCSS } from "./mappers/style.js";
import { transpilerScripts } from "./mappers/script.js";
import { load as loadTemplate, template } from "./templates.js";
import _config from "./config.json" with { type: "json" };
const SFC_TEMPLATE = await loadTemplate("sfc");
const SFC_SCRIPT_TEMPLATE = await loadTemplate("sfc.script", "js");
const cache = new Map();
async function render(tagName, component, componentPath) {
    const throwOverloadError = () => {
        throw new SyntaxError(`Component must not be overloaded <${tagName.toUpperCase()}>`);
    };
    const ast = parse(component, {});
    let templateStr, styleStr, scriptStr;
    let scriptLang;
    for (const child of ast.children.slice(0, 3)) {
        if (child.tagName === "TEMPLATE") {
            templateStr && throwOverloadError();
            templateStr = child.innerHTML.trim();
            continue;
        }
        const lang = (child.getAttribute("lang") ?? "").trim().toLowerCase();
        if (child.tagName === "STYLE") {
            styleStr && throwOverloadError();
            styleStr = child.innerHTML.trim();
            styleStr = (lang === "scss")
                ? await transpilerSCSS.apply(styleStr)
                : styleStr;
            continue;
        }
        if (child.tagName === "SCRIPT") {
            scriptStr && throwOverloadError();
            scriptStr = child.innerHTML.trim();
            scriptLang = lang;
            continue;
        }
    }
    if (!templateStr && !scriptStr && !styleStr)
        throw new RangeError("Components must not be empty (or malformed)");
    if (ast.children.length > 3)
        throw new RangeError("Invalid element count on top level");
    const scriptImportStatements = [];
    scriptStr = (scriptStr ?? "")
        .replace(/(^|\n)\s*import\s+(?:(?:(?:[\w*{}\n\r\t ,]+)\s+from\s+)?(?:".*?"|'.*?'|`.*?`)|(?:".*?"|'.*?'|`.*?`));?\s*(\n|$)/g, (statement) => {
        scriptImportStatements.push(statement);
        return "";
    });
    let renderedComponentScript = SFC_SCRIPT_TEMPLATE;
    renderedComponentScript = template(renderedComponentScript, "IMPORTS", scriptImportStatements.join("\n"));
    renderedComponentScript = template(renderedComponentScript, "LIFECYCLE", scriptStr);
    renderedComponentScript = template(renderedComponentScript, "TAG_NAME", tagName);
    renderedComponentScript = await transpilerScripts
        .apply(renderedComponentScript, null, scriptLang, dirname(componentPath));
    let renderedComponent = SFC_TEMPLATE;
    renderedComponent = template(renderedComponent, "TEMPLATE", templateStr);
    renderedComponent = template(renderedComponent, "STYLE", styleStr);
    renderedComponent = template(renderedComponent, "SCRIPT", renderedComponentScript);
    renderedComponent = template(renderedComponent, "TEMPLATE_ID", createHash("md5")
        .update(renderedComponent)
        .digest("hex")
        .slice(0, 8));
    return renderedComponent;
}
export async function renderComponents(srcPath, force = false, prefix = _config.tagNamePrefix) {
    let wasModified = false;
    const wrapResults = (data) => {
        return {
            wasModified,
            data
        };
    };
    if (!existsSync(srcPath))
        return wrapResults([]);
    const componentsData = await Promise.all((await readdir(srcPath, {
        recursive: false,
        withFileTypes: true
    }))
        .filter((dirent) => dirent.isFile() && extname(dirent.name) === ".html")
        .map(async (dirent) => {
        const componentPath = join(srcPath, dirent.name);
        if (!force && !(await Bundler.fileModified(componentPath)))
            return cache.get(componentPath);
        const data = await render(`${prefix}${dirent.name.slice(0, -extname(dirent.name).length)}`, (await readFile(componentPath)).toString(), componentPath);
        cache.set(componentPath, data);
        wasModified = true;
        return data;
    }));
    return wrapResults(componentsData);
}
