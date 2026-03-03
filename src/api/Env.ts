import { readFile, stat } from "fs/promises";

import { resolve, join } from "path";


const ENV_FILE_PATH: string = "./.env";


export class Env {
	private readonly absoluteEnvFilePath: string;

	constructor(rootDirectoryPath: string) {
		this.absoluteEnvFilePath = resolve(join(rootDirectoryPath, ENV_FILE_PATH));
	}

	public async toObject(): Promise<Record<string, string>> {
		try {
			await stat(this.absoluteEnvFilePath);
		} catch(err) {
			if((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;

			return {};
		}

		const rawEnvFile: string = (await readFile(this.absoluteEnvFilePath)).toString();
		const keyValuePairs: [ string, string ][] = (rawEnvFile.match(/(^|\r?\n) *[a-z0-9_]+=[^\s]* *(\r?\n|$)/gi) ?? [])
			.map((line: string) => line.trim())
			.map((line: string) => line.split("=") as [ string, string ]);

		return Object.fromEntries(keyValuePairs) as Record<string, string>;
	}

	public async read(key: string): Promise<string | undefined> {
		const envObject: Record<string, string> = await this.toObject();

		return envObject[key];
	}
}