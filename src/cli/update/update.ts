import { spawnSync } from "child_process";

import { isUpdateAvailable, readLocalPackage, retrievePackageVersions, PackageVersions } from "./versions.js";


function installUpdate(globally = false) {
	return spawnSync("npm", [ "install", globally ? "-g" : "", "webfuse-com/labs" ], {
		cwd: process.cwd(),
		stdio: "inherit"
	});
}


export async function update(): Promise<PackageVersions> {
	const packageVersions: PackageVersions = await retrievePackageVersions();
	const availableUpdate: boolean = isUpdateAvailable(packageVersions);

	if(!availableUpdate) return null;


	const packageObj = await readLocalPackage<{
		name: string;

		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	}>();

	// Re-install locally if exists locally
	if(!!packageObj.dependencies[packageObj.name] || !!packageObj.devDependencies[packageObj.name]) {
		installUpdate();
	} else {
		// (Re-)install globally if exists globally
		installUpdate(true);
	}

	return packageVersions;
}