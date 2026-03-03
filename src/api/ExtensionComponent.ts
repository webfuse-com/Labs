import { dirname, join } from "path";
import { Stats } from "fs";
import { stat, mkdir, writeFile, readFile } from "fs/promises";

import { AssetBundler } from "./AssetBundler.js";


const EXTENSION_ALIASES: Record<string, string[]> = {
	"js": [ "ts" ]
};


type NoData = null;


export type ExtensionComponentType =
	| "background"
	| "content"
	| "popup"
	| "newtab";

interface ExtensionComponentFileMap<T> extends Record<string, T | undefined> {
    js?: T;
    html?: T;
    css?: T;
};

export type ExtensionComponentConfig = ExtensionComponentFileMap<{
	enabled: boolean;

	assetBundler?: AssetBundler;
}>;


export class ExtensionFileReader {
	private readonly absoluteSrcFilePaths: string[];
	private readonly AssetBundler: AssetBundler;

	private lastModificationTimeMs: number;

	constructor(absoluteSrcDirectoryPath: string, fileNames: string[], AssetBundler?: AssetBundler) {
		this.absoluteSrcFilePaths = fileNames
			.map((fileName: string) => join(absoluteSrcDirectoryPath, fileName));
		this.AssetBundler = AssetBundler;

		this.lastModificationTimeMs = -Infinity;
	}

	private async resolveSingleAbsoluteSrcFilePath(): Promise<string> {
		for(const absoluteSrcFilePath of this.absoluteSrcFilePaths) {
			try {
				await stat(absoluteSrcFilePath);

				return absoluteSrcFilePath;
			} catch(err) {
				if((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
			}
		}

		const defaultAbsoluteSrcFilePath: string = this.absoluteSrcFilePaths[0];

		await mkdir(dirname(defaultAbsoluteSrcFilePath), { recursive: true });
		await writeFile(defaultAbsoluteSrcFilePath, "");

		return defaultAbsoluteSrcFilePath;
	}

	public async read(): Promise<string | NoData> {
		const absoluteSrcFilePath: string = await this.resolveSingleAbsoluteSrcFilePath();

		const stats: Stats = await stat(absoluteSrcFilePath);
		const lastModificationTimeMs = stats.mtimeMs;
		const hasChanged: boolean = (lastModificationTimeMs > this.lastModificationTimeMs);

		if(!hasChanged) return null;

		const rawData: string = (await readFile(absoluteSrcFilePath)).toString();
		const assetBuiltData: string = this.AssetBundler
			? await this.AssetBundler.bundle(rawData, dirname(absoluteSrcFilePath))
			: rawData;

		this.lastModificationTimeMs = lastModificationTimeMs;

		return assetBuiltData;
	}
}

export class ExtensionFileEmitter {
	private readonly absoluteDistFilePath: string;

	constructor(absoluteDistDirectoryPath: string, fileName: string) {
		this.absoluteDistFilePath = join(absoluteDistDirectoryPath, fileName);
	}

	public async toFile(data: string): Promise<string> {
		await mkdir(dirname(this.absoluteDistFilePath), { recursive: true });

		await writeFile(this.absoluteDistFilePath, data);

		return this.absoluteDistFilePath;
	}
}

export class ExtensionComponent {
	private readonly artifactsConfig: ExtensionComponentConfig;
	private readonly readers: ExtensionComponentFileMap<ExtensionFileReader>;
	private readonly emitters: ExtensionComponentFileMap<ExtensionFileEmitter>;

	public readonly type: ExtensionComponentType;

	constructor(
		type: ExtensionComponentType,
		name: string,
		absoluteSrcDirectoryPath: string,
		absoluteDistDirectoryPath: string,
		artifactsConfig: ExtensionComponentConfig = {}
	) {
		this.type = type;
		this.artifactsConfig = artifactsConfig;
		this.readers = {};
		this.emitters = {};

		for(const artifactExtension in this.artifactsConfig) {
			if(!this.artifactsConfig[artifactExtension].enabled) continue;

			const inFileNames: string[] = [
				artifactExtension,
				...(EXTENSION_ALIASES[artifactExtension] ?? [])
			].map((artifactExtension: string) => `${name}.${artifactExtension}`);
			this.readers[artifactExtension] = new ExtensionFileReader(
				join(absoluteSrcDirectoryPath, name),
				inFileNames,
				this.artifactsConfig[artifactExtension].assetBundler
			);

			const outFileName: string = `${name}.${artifactExtension}`;
			this.emitters[artifactExtension] = new ExtensionFileEmitter(
				join(absoluteDistDirectoryPath, name),
				outFileName
			);
		}
	}

	public async build() {
		const emittedFilesPaths: string[] = [];

		for(const artifactExtension in this.artifactsConfig) {
			if(!this.artifactsConfig[artifactExtension].enabled) continue;

			const data: string | NoData = await this.readers[artifactExtension].read();

			if(data === null) continue;

			const emittedFilePath: string = await this.emitters[artifactExtension].toFile(data);

			emittedFilesPaths.push(emittedFilePath);
		}

		return emittedFilesPaths;
	}
}