import { join } from "path";
import { tmpdir } from "os";
import { readFileSync, writeFileSync } from "fs";
import { get } from "https";
const RAW_PACKAGE_URL = "https://raw.githubusercontent.com/webfuse-com/labs/refs/heads/main/package.json";
const TEMP_FILE = join(tmpdir(), "labs.tmp");
const CHECK_INTERVAL = 1000 * 60 * 30;
function fetchCurrentVersion() {
    return new Promise(async (resolve) => {
        const libPackageModule = await import(join(import.meta.dirname, "../../../package.json"), { with: { type: "json" } });
        const packageJson = libPackageModule.default;
        resolve(packageJson.version);
    });
}
function fetchLatestVersion() {
    return new Promise(resolve => {
        get(RAW_PACKAGE_URL, res => {
            const chunks = [];
            res.on("data", (chunk) => {
                chunks.push(chunk);
            });
            res.on("end", () => {
                const packageJson = JSON.parse(chunks.join(""));
                resolve(packageJson.version);
            });
        });
    });
}
export async function retrieveAvailableUpdate() {
    const resolveInterface = (semver) => {
        return {
            string: semver,
            number: semver.match(/\d+/g).map((digit) => parseInt(digit))
        };
    };
    const currentVersion = await fetchCurrentVersion();
    const latestVersion = await fetchLatestVersion();
    const info = {
        current: resolveInterface(currentVersion),
        latest: resolveInterface(latestVersion)
    };
    try {
        const lastCheckTimestamp = parseInt(readFileSync(TEMP_FILE).toString());
        if (Date.now() - lastCheckTimestamp <= CHECK_INTERVAL)
            return info;
    }
    catch { }
    writeFileSync(TEMP_FILE, Date.now().toString());
    return info;
}
export async function updateAvailable() {
    const availableUpdate = await retrieveAvailableUpdate();
    return availableUpdate.latest.number
        .reduce((isOutdated, versionSegment, i) => {
        return isOutdated || (versionSegment > availableUpdate.current.number[i]);
    }, false)
        ? availableUpdate
        : null;
}
export function isGloballyInstalled() {
    const binPath = process.argv[1];
    return /^\/usr\//.test(binPath) && /\/bin\//.test(binPath);
}
