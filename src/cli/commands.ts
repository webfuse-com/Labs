import { readFileSync } from "fs";
import { join, resolve } from "path";

import { CommandRegistry } from "./CommandRegistry.js";
import { parseOption, hasFlag } from "./args.js";
import { print } from "./print.js";
import { create } from "./create/create.js";
import { prototype } from "./prototype/prototype.js";
import { IPackageVersions, isUpdateAvailable, retrievePackageVersions } from "./update/versions.js";

import { type ExtensionBuilder, createExtensionBuilder } from "../api/api.js";


const HELP_TEXT_FILE_PATH = join(import.meta.dirname, "../../cli.help.txt");


export const commandRegistry: CommandRegistry = new CommandRegistry();


commandRegistry.register("help", () => {
	console.log(
		readFileSync(HELP_TEXT_FILE_PATH).toString()
            .replace(/(Webfuse|Labs)/g, "\x1b[1m$1\x1b[0m")
            .replace(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/g, "\x1b[38;2;222;74;183m$1\x1b[0m")
	);
});

const bundle = async (watch: boolean = false): Promise<string> => {
	const absoluteWorkingDirectoryPath: string = resolve(parseOption("working-dir") ?? ".");

	const extensionBuilder: ExtensionBuilder = createExtensionBuilder(absoluteWorkingDirectoryPath);

	if(!watch) {
		const emittedPaths: string[] = await extensionBuilder.build();

		print(
			[
				"Emitted bundle:",
				...emittedPaths
                    .map((line: string) => `→ ${line}`)
			]
                .join("\n")
		);

		return absoluteWorkingDirectoryPath;
	}

	// TODO

	// TODO: Bundle events
	return absoluteWorkingDirectoryPath;
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
	const absoluteWorkingDirectoryPath: string = await bundle(true);

	await prototype(absoluteWorkingDirectoryPath);
});

commandRegistry.register("update", async () => {
	const packageVersions: IPackageVersions = await retrievePackageVersions();

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