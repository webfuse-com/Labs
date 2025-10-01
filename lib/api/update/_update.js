import { execSync, spawnSync } from "child_process";
import { getPackage } from "../package.js";
import { updateAvailable } from "./check-update.js";
function installUpdate(globally = false) {
    return spawnSync("npm", ["install", globally ? "-g" : "", "webfuse-com/labs"], {
        cwd: process.cwd(),
        stdio: "inherit"
    });
}
export async function update() {
    const availableUpdate = await updateAvailable();
    if (!availableUpdate)
        return null;
    const packageObj = await getPackage();
    const globalPackages = execSync("npm list -g --depth 0").toString();
    globalPackages.includes(packageObj.name)
        && installUpdate(true);
    (!!packageObj.dependencies[packageObj.name]
        || !!packageObj.devDependencies[packageObj.name])
        && installUpdate();
    return availableUpdate;
}
