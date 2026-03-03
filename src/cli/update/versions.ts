import { join } from "path";
import { get } from "https";
import { readFile } from "fs/promises";


const LOCAL_PACKAGE_FILE_PATH: string = join(import.meta.dirname, "../../package.json");
const REMOTE_PACKAGE_URL: string = "https://raw.githubusercontent.com/webfuse-com/labs/refs/heads/main/package.json";


type ResolveInterface = {
	string: string;
	number: [ number, number, number ];
};

export type PackageVersions = {
    current: ResolveInterface;
    latest: ResolveInterface;
};


function fetchLocalVersion(): Promise<string> {
	return new Promise(async resolve => {
		const localPackage = await readLocalPackage<{ version: string; }>();

		resolve(localPackage.version);
	});
}

function fetchLatestVersion(): Promise<string> {
	return new Promise(resolve => {
		get(REMOTE_PACKAGE_URL, res => {
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


export async function readLocalPackage<T>(): Promise<T> {
	return JSON.parse(
		(await readFile(LOCAL_PACKAGE_FILE_PATH)).toString()
	) as T;
}

export async function retrievePackageVersions(): Promise<PackageVersions> {
	const resolveInterface = (semver: string): ResolveInterface => {
		return {
			string: semver,
			number: semver.match(/\d+/g).map((digit: string) => parseInt(digit)) as [ number, number, number ]
		};
	};

	const currentVersion: string = await fetchLocalVersion();
	const latestVersion: string = await fetchLatestVersion();

	const info = {
		current: resolveInterface(currentVersion),
		latest: resolveInterface(latestVersion)
	};

	return info;
}

export function isUpdateAvailable(packageVersions: PackageVersions): boolean {
	return packageVersions.latest.number
		.reduce((isOutdated: boolean, versionSegment: number, i: number) => {
			return isOutdated || (versionSegment > packageVersions.current.number[i]);
		}, false);	// forward-only
}

export function isGloballyInstalled(): boolean {
	const binPath: string = process.argv[1];

	return /^\/usr\//.test(binPath) && /\/bin\//.test(binPath);
}