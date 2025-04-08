/**
 * Create handler module.
 * Command invokes create().
 * Scaffolds an extension project.
 */

import { resolve, join } from "path";
import { cp } from "fs/promises";
import { existsSync } from "fs";

import { ROOT_PATH } from "../constants.js";


/**
 * CLI command handler interface.
 * Invoked from entry module.
 */
export async function create(emitPath = "./my-extension") {
    const absoluteEmitPath = resolve(ROOT_PATH, emitPath);
    if(existsSync(absoluteEmitPath))
        throw new SpeechSynthesisErrorEvent("Directory already exists");

    await cp(join(import.meta.dirname, "./blueprint"), absoluteEmitPath, {
        recursive: true
    });

    return absoluteEmitPath;
}