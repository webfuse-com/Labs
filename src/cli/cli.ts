#!/usr/bin/env node


import { homedir } from "os";
import { join, dirname } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";

import { print } from "./print.js";
import { parsePositional } from "./args.js";
import { commandRegistry } from "./commands.js";
import { isUpdateAvailable, retrievePackageVersions, IPackageVersions } from "./update/versions.js";


const CONFIG_STATE_FILE_PATH: string = join(
	(() => {
		const home = homedir();

		if (process.platform === "win32")
			return join(process.env.APPDATA || join(home, "AppData", "Roaming"));
		if (process.platform === "darwin")
			return join(home, "Library", "Application Support");
		return process.env.XDG_CONFIG_HOME ?? join(home, ".config");
	})(),
	"./labs/update.txt"
);
const UPDATE_AVAILABILITY_CHECK_INTERVAL: number = 1000 * 60 * 60 * 24; // 24 hours


// Invoke command
const command = parsePositional(0);
if(!command || command.startsWith("--"))
	throw new SyntaxError("Missing command. Run command 'help' for a list of available commands.");

commandRegistry.invokeCommand(command);


// Check for update periodically
let lastUpdateCheckTimestamp: number;
try {
	lastUpdateCheckTimestamp = parseInt((await readFile(CONFIG_STATE_FILE_PATH)).toString() ?? "0");
} catch {
	lastUpdateCheckTimestamp = 0;
}
if((Date.now() - lastUpdateCheckTimestamp) > UPDATE_AVAILABILITY_CHECK_INTERVAL) {
	const packageVersions: IPackageVersions = await retrievePackageVersions();
	if(isUpdateAvailable(packageVersions)) {
		print(`A new version of Labs is available \x1b[2m${
			packageVersions.current.string
		} → ${
			packageVersions.latest.string
		}\x1b[22m (re-install to update).`, false, true);
	}

	await mkdir(dirname(CONFIG_STATE_FILE_PATH), { recursive: true });

	writeFile(CONFIG_STATE_FILE_PATH, Date.now().toString());
}