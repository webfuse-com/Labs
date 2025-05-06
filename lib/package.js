/**
 * Extension package.json read utilities.
 */
import { existsSync } from "fs";
import { join } from "path/posix";
import { ROOT_PATH } from "./constants.js";
export async function getPackage() {
    const packageJsonPath = join(ROOT_PATH, "package.json");
    return existsSync(packageJsonPath)
        ? (await import(packageJsonPath, { with: { type: "json" } })).default
        : {};
}
//# sourceMappingURL=package.js.map