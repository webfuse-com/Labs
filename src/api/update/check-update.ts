/**
 * Update availability utilities (to notify user).
 */

import { join } from "path";
import { tmpdir } from "os";
import { readFileSync, writeFileSync } from "fs";
import { get } from "https";


type TResolveInterface = {
	string: string;
	number: [ number, number, number ];
};

export type TUpdateInfo = {
    current: TResolveInterface;
    latest: TResolveInterface;
};


const RAW_PACKAGE_URL = "https://raw.githubusercontent.com/surfly/labs/refs/heads/main/package.json";
const TEMP_FILE = join(tmpdir(), "labs.tmp");
const CHECK_INTERVAL = 1000 * 60 * 30;  // 30 min


function fetchCurrentVersion(): Promise<string> {
	return new Promise(async resolve => {
		const libPackageModule = await import(
			join(import.meta.dirname, "../../../package.json"), { with: { type: "json" } }
		) as {
            default: { version: string; }
        };
		const packageJson = libPackageModule.default;

		resolve(packageJson.version);
	});
}

function fetchLatestVersion(): Promise<string> {
	return new Promise(resolve => {
		get(RAW_PACKAGE_URL, res => {
			const chunks: string[] = [];
			res.on("data", (chunk: string) => {
				chunks.push(chunk);
			});
			res.on("end", () => {
				const packageJson = JSON.parse(chunks.join("")) as { version: string; };

				resolve(packageJson.version);
			});
		});
	});
}

export async function retrieveAvailableUpdate(): Promise<TUpdateInfo> {
	const resolveInterface = (semver: string): TResolveInterface => {
		return {
			string: semver,
			number: semver.match(/\d+/g).map((digit: string) => parseInt(digit)) as [ number, number, number ]
		};
	};

	const currentVersion: string = await fetchCurrentVersion();
	const latestVersion: string = await fetchLatestVersion();

	const info = {
		current: resolveInterface(currentVersion),
		latest: resolveInterface(latestVersion)
	};

	try {
		const lastCheckTimestamp = parseInt(readFileSync(TEMP_FILE).toString());
		if(Date.now() - lastCheckTimestamp <= CHECK_INTERVAL) return info;
	} catch {}

	writeFileSync(TEMP_FILE, Date.now().toString());

	return info;
}

export async function updateAvailable(): Promise<TUpdateInfo> {
	const availableUpdate = await retrieveAvailableUpdate();

	return availableUpdate.latest.number
			.reduce((isOutdated: boolean, versionSegment: number, i: number) => {
				return isOutdated || (versionSegment > availableUpdate.current.number[i]);
			}, false)	// forward-only history
		? availableUpdate
		: null;
}

export function isGloballyInstalled(): boolean {
	const binPath: string = process.argv[1];

	return /^\/usr\//.test(binPath) && /\/bin\//.test(binPath);
}