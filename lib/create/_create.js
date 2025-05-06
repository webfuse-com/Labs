import { resolve } from "path";
import { cp } from "fs/promises";
import { existsSync } from "fs";
import { ROOT_PATH } from "../constants.js";
import { getAssetPath } from "../assets.js";
export async function create(emitPath = "./my-extension") {
    const absoluteEmitPath = resolve(ROOT_PATH, emitPath);
    if (existsSync(absoluteEmitPath))
        throw new ReferenceError("Directory already exists");
    await cp(getAssetPath("create", "./blueprint"), absoluteEmitPath, {
        recursive: true
    });
    return absoluteEmitPath;
}
