import { join } from "path";
import { tmpdir } from "os";
import { readFileSync, writeFileSync } from "fs";
import { get } from "https";
const RAW_PACKAGE_URL = "https://raw.githubusercontent.com/surfly/labs/refs/heads/main/package.json";
const TEMP_FILE = join(tmpdir(), "labs.tmp");
const CHECK_INTERVAL = 1000 * 60 * 30;
function fetchCurrentVersion() {
    return new Promise(async (resolve) => {
        const libPackageModule = await import(join(import.meta.dirname, "../package.json"), { with: { type: "json" } });
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
    try {
        const lastCheckTimestamp = parseInt(readFileSync(TEMP_FILE).toString());
        if (Date.now() - lastCheckTimestamp <= CHECK_INTERVAL)
            return null;
    }
    catch { }
    writeFileSync(TEMP_FILE, Date.now().toString());
    const resolveInterface = (semver) => {
        return {
            string: semver,
            number: parseInt(semver.match(/\d+/g).join(""))
        };
    };
    const currentVersion = await fetchCurrentVersion();
    const latestVersion = await fetchLatestVersion();
    return {
        current: resolveInterface(currentVersion),
        latest: resolveInterface(latestVersion)
    };
}
export function isGloballyInstalled() {
    const binPath = process.argv[1];
    return /^\/usr\//.test(binPath) && /\/bin\//.test(binPath);
}
