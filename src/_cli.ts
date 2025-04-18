#!/usr/bin/env node


/**
 * Abstract entry module (CLI).
 * Spawns an extra process with suppressed experimental wranings.
 */

import { spawn } from "child_process";
import { join } from "path";


spawn("node", [ "--disable-warning=ExperimentalWarning", join(import.meta.dirname, "./cli.js"), ...process.argv.slice(2) ], {
	cwd: process.cwd(),
	stdio: "inherit",
	windowsHide: true
});