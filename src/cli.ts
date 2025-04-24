#!/usr/bin/env node


/**
 * Entry module (CLI).
 * Switches command (first positional argument) across handlers.
 */

import { existsSync, readFileSync } from "fs";
import { join, normalize } from "path";

import { ROOT_PATH, SRC_DIR } from "./constants.js";
import { hasFlag, parseOption, parsePositional } from "./args.js";
import { isGloballyInstalled, retrieveAvailableUpdate, TUpdateInfo } from "./check-update.js";
import { bundle, TBundleResults } from "./bundle/_bundle.js";
import { create } from "./create/_create.js";
import { preview } from "./preview/_preview.js";
import { update } from "./update/_update.js";


/**
 * Intercept all uncaught errors and log according to log detail.
 * Log detail is message only by default.
 * --stacktrace enables verbose logs, i.e. full errors.
 */
const printError = (err: Error) => {
	console.error(`\x1b[31m\n${
		hasFlag("stacktrace") ? err.stack : err.message
	}\x1b[0m`);

	process.exit(1);
};
process.on("uncaughtException", printError);
process.on("unhandledRejection", printError);


/**
 * Uniform log interface. Prints with a leading timestamp, in primary color.
 */
const print = (
	message: string,
	replaceLastLine: boolean = false,
	subtle: boolean = false,
	noTimestamp: boolean = false
) => {
	console.log(`${
		replaceLastLine ? `\x1b[1A\x1b[2K` : ""
	}\x1b[2m${
		!noTimestamp
			? `[${
				new Date().toLocaleString(
					Intl.DateTimeFormat().resolvedOptions().locale, {
						hour: "numeric", minute: "numeric", second: "numeric"
					}
				)
			}] `
			: ""
	}\x1b[0m${
		!subtle ? "\x1b[38;2;222;74;183m" : ""
	}${
		message
	}\x1b[0m`);
};


const cmd = parsePositional(0);
if(!cmd)
	throw new SyntaxError("Missing command. Run command 'help' for a list of available commands.");


const availableUpdate = await retrieveAvailableUpdate();
if(
	isGloballyInstalled()
	&& availableUpdate.current.number < availableUpdate.latest.number
) {
	print(`A new version of Labs is available \x1b[2m${
		availableUpdate.current.string
	} → ${
		availableUpdate.latest.string
	}\x1b[22m (re-install to update).`, false, true);
}


/**
 * Check whether the project directory (ROOT_PATH) corresponds to a valid extension project.
 * Throws an error if is invalid, does nothing otherwise.
 * Requirements for a valid root:
 * - contains package.json
 * - contains src/ directory
 */
const checkExtensionDir = () => {
	if(!existsSync(join(ROOT_PATH, "package.json")))
		throw new SyntaxError("Extension directory requires a valid package.json");
	if(!existsSync(join(ROOT_PATH, SRC_DIR)))
		throw new SyntaxError(`Extension directory requires a ${normalize(`/${SRC_DIR}`)} source directory`);
};

/**
 * Use the bundler interface.
 * Is used with the bundle command, as well as the non-standalone preview command.
 */
const cmdBundle = async (cb = (() => {})) => {
	print("Bundle extension...");

	const emitter = await bundle(hasFlag("debug", "D"));

	emitter.on("bundle", (stats: TBundleResults) => {
		const normalizePath = (path: string): string => {
			path = normalize(path);
			return normalize(path.slice(normalize(process.cwd()).length));
		};

		print(
			`Bundled extension \x1b[2m(${normalizePath(stats.src)} → ${normalizePath(stats.dist)}, ${stats.count} files, ${stats.ms}ms)\x1b[22m.`,
			true
		);

		cb();
	});

	return emitter;
};

// Command switch to invoke the correct handler.
switch(cmd) {
	case "help": {
		console.log(
			readFileSync(join(import.meta.dirname, "../cli.help.txt")).toString()
                .replace(/(Webfuse|Labs)/g, "\x1b[1m$1\x1b[0m")
                .replace(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/g, "\x1b[38;2;222;74;183m$1\x1b[0m")
		);
		break;
	}
	case "version": {
		print(availableUpdate.current.string, false, false, true);
		break;
	}
	case "create": {
		const emitPath: string = await create(parseOption("path", "P"));
		print(`Created extension project blueprint at \x1b[1m${emitPath}\x1b[22m.`);

		break;
	}
	case "bundle": {
		checkExtensionDir();

		(await cmdBundle())
            .once("bundle", () => !hasFlag("watch", "W") && process.exit(0));

		break;
	}
	case "preview": {
		checkExtensionDir();

		const serverInfo = await preview();

		print(`Preview available at \x1b[1m\x1b[4mhttp://localhost:${serverInfo.http.port}\x1b[22m\x1b[24m.`);

		!hasFlag("only")
            && cmdBundle(() => serverInfo.ws.handle.push());

		break;
	}
	case "update": {
		const installedUpdate: TUpdateInfo = await update();

		print(
			!installedUpdate
				? "No update available at the moment."
				: `Successfully installed Labs v${installedUpdate.latest.string}.`
		);

		break;
	}
	default:
		// Fallback handler
		throw new SyntaxError(`Invalid command '${cmd}'. Run command 'help' for a list of available commands.`);
}