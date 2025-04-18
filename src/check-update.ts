/**
 * Update availability utilities (to notify user).
 */

import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { get } from "https";


export type TUpdateInfo = {
    current: string;
    latest: string;
};


const RAW_PACKAGE_URL = "https://raw.githubusercontent.com/surfly/labs/refs/heads/main/package.json";
const TEMP_FILE = join(import.meta.dirname, ".tmp");
const CHECK_INTERVAL = 1000 * 60 * 30;  // 30 min


function fetchCurrentVersion(): Promise<string> {
	return new Promise(async resolve => {
		const packageModule: {
            default: { version: string; }
        } = await import(join(import.meta.dirname, "../package.json"));
		const packageJson = packageModule.default;

		resolve(packageJson.version);
	});
}

function fetchLatestVersion(): Promise<string> {
	return new Promise(resolve => {
		get(RAW_PACKAGE_URL, res => {
			const chunks: string[] = [];
			res.on("data", chunk => {
				chunks.push(chunk);
			});
			res.on("end", () => {
				const packageJson = JSON.parse(chunks.join(""));

				resolve(packageJson.version);
			});
		});
	});
}

export async function retrieveAvailableUpdate(): Promise<null|TUpdateInfo> {
	const binPath: string = process.argv[1];
	if(!/^\/usr\//.test(binPath) || !/\/bin\//.test(binPath)) {
		return null;
	}

	try {
		const lastCheckTimestamp = parseInt(readFileSync(TEMP_FILE).toString());
		if(Date.now() - lastCheckTimestamp <= CHECK_INTERVAL) return null;
	} catch {}

	writeFileSync(TEMP_FILE, Date.now().toString());

	const numerifySemver = (semver: string): number => parseInt(semver.match(/\d+/g).join(""));

	try {
		const currentVersion: string = await fetchCurrentVersion();
		const latestVersion: string = await fetchLatestVersion();

		return (numerifySemver(currentVersion) < numerifySemver(latestVersion))
			? {
				current: currentVersion,
				latest: latestVersion
			}
			: null;
	} catch {
		return null;
	}
}