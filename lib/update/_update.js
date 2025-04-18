import { execSync, spawnSync } from "child_process";
import { retrieveAvailableUpdate } from "../check-update.js";
import { getPackage } from "../package.js";
function installUpdate(globally = false) {
    return spawnSync("npm", ["install", globally ? "-g" : "", "surfly/labs"], {
        cwd: process.cwd(),
        stdio: "inherit"
    });
}
export async function update() {
    const availableUpdate = await retrieveAvailableUpdate();
    if (!availableUpdate) {
        return null;
    }
    const packageObj = await getPackage();
    const globalPackages = execSync("npm list -g --depth 0").toString();
    globalPackages.includes(packageObj.name)
        && installUpdate(true);
    (!!packageObj.dependencies[packageObj.name]
        || !!packageObj.devDependencies[packageObj.name])
        && installUpdate();
    return availableUpdate;
}
