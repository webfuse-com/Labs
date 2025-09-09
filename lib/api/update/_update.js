/**
 * Update module.
 * Command invokes update().
 * Scaffolds an extension project.
 */
import { execSync, spawnSync } from "child_process";
import { getPackage } from "../package.js";
import { updateAvailable } from "./check-update.js";
/**
 * Install update via NPM CLI.
 */
function installUpdate(globally = false) {
    return spawnSync("npm", ["install", globally ? "-g" : "", "surfly/labs"], {
        cwd: process.cwd(),
        stdio: "inherit"
    });
}
/**
 * CLI command handler interface.
 * Invoked from entry module.
 */
export async function update() {
    const availableUpdate = await updateAvailable();
    if (!availableUpdate)
        return null;
    const packageObj = await getPackage();
    const globalPackages = execSync("npm list -g --depth 0").toString();
    // Re-install globally if exists globally
    globalPackages.includes(packageObj.name)
        && installUpdate(true);
    // Re-install locally if exists locally
    (!!packageObj.dependencies[packageObj.name]
        || !!packageObj.devDependencies[packageObj.name])
        && installUpdate();
    return availableUpdate;
}
//# sourceMappingURL=_update.js.map