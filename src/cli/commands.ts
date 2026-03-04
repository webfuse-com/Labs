import { readFileSync } from "fs";
import { join, resolve } from "path";

import { CommandRegistry } from "./CommandRegistry.js";
import { parseOption, hasFlag } from "./args.js";
import { print } from "./print.js";
import { create } from "./create/create.js";
import { prototype } from "./prototype/prototype.js";
import { PackageVersions, isUpdateAvailable, retrievePackageVersions } from "./update/versions.js";

import { type Extension, createExtension } from "../api/api.js";


const HELP_TEXT_FILE_PATH = join(import.meta.dirname, "../../cli.help.txt");


export const commandRegistry: CommandRegistry = new CommandRegistry();


commandRegistry.register("help", () => {
	console.log(
		readFileSync(HELP_TEXT_FILE_PATH).toString()
            .replace(
            	/(Webfuse|Labs)/g,
            	"\x1b[1m$1\x1b[0m"
            )
            .replace(
            	/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/g,
            	"\x1b[38;2;222;74;183m$1\x1b[0m"
            )
	);
});

const bundle = async (watch: boolean = false): Promise<{
	absoluteWorkingDirectoryPath: string;
	extensionEventEmitter?: Extension;
}> => {
	const absoluteWorkingDirectoryPath: string = resolve(parseOption("working-dir") ?? ".");

	const extension: Extension = createExtension(absoluteWorkingDirectoryPath);

	const emittedPaths: string[] = await extension.bundle();
	const emittedFileCount: number = emittedPaths.length;
	const maxPathPrintLines: number = 10;
	print(
		[
			"Emitted bundle:",
			...emittedPaths
				.slice(0, maxPathPrintLines)
				.map((line: string) => `→ ${line}`),
			emittedFileCount > maxPathPrintLines ? `+ ${emittedFileCount - maxPathPrintLines} more` : ""
		]
			.filter((line: string) => !!line)
			.join("\n")
	);

	if(!watch) return { absoluteWorkingDirectoryPath };

	extension
		.on("bundle", (emittedFilesPaths: string[]) => {
			print(`→ Emitted bundle (rebuilt ${emittedFilesPaths.length} files).`);
		});


	extension.toggleWatch();

	return {
		absoluteWorkingDirectoryPath,
		extensionEventEmitter: extension
	};
};

commandRegistry.register("bundle",async  () => {
	await bundle(hasFlag("watch"));
});

commandRegistry.register("create", async () => {
	const templatePath: string = parseOption("path");

	const absoluteTemplatePath: string = await create(templatePath);

	print(`Created extension project blueprint at \x1b[1m${absoluteTemplatePath}\x1b[22m.`);
});

commandRegistry.register("prototype", async () => {
	const bundleResult = await bundle(true);

	const serverResult = await prototype(bundleResult.absoluteWorkingDirectoryPath);

	bundleResult.extensionEventEmitter
		.on("bundle", () => serverResult.wsServerHandler.sendRefresh());

	print(`UI prototype available at \x1b[1mhttp://localhost:${serverResult.appPort}\x1b[0m`);
});

commandRegistry.register("update", async () => {
	const packageVersions: PackageVersions = await retrievePackageVersions();

	print(
		!isUpdateAvailable(packageVersions)
			? "No update available at the moment."
			: `Successfully installed Labs to v${packageVersions.latest.string}.`
	);
});

commandRegistry.register("version", async () => {
	print(
		(await retrievePackageVersions())
            .current
            .string,
		false, false, true
	);
});