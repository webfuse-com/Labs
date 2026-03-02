import { dirname, join, resolve } from "path";
import { Stats } from "fs";
import { stat, mkdir, writeFile, readFile } from "fs/promises";


type NoData = null;

interface ExtensionComponentFileMap<T> extends Record<string, T | undefined> {
    js?: T;
    html?: T;
    css?: T;
};


export class ExtensionFileReader {
	private readonly absoluteSrcFilePath: string;

	private lastModificationTimeMs: number;

	constructor(absoluteSrcFilePath: string) {
		this.absoluteSrcFilePath = absoluteSrcFilePath;

		this.lastModificationTimeMs = -Infinity;
	}

	private async ensureFileExists() {
		try {
			await stat(this.absoluteSrcFilePath);
		} catch(err) {
			if((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;

			await mkdir(dirname(this.absoluteSrcFilePath), { recursive: true });
			await writeFile(this.absoluteSrcFilePath, "");
		}
	}

	public async read(): Promise<string | NoData> {
		await this.ensureFileExists();

		const stats: Stats = await stat(this.absoluteSrcFilePath);
		const lastModificationTimeMs = stats.mtimeMs;
		const hasChanged: boolean = (lastModificationTimeMs > this.lastModificationTimeMs);

		if(!hasChanged) return null;

		const data: string = (await readFile(this.absoluteSrcFilePath)).toString();

		this.lastModificationTimeMs = lastModificationTimeMs;

		return data;
	}
}

export class ExtensionFileEmitter {
	private readonly absoluteDistFilePath: string;

	constructor(absoluteDistFilePath: string) {
		this.absoluteDistFilePath = absoluteDistFilePath;
	}

	public async toFile(data: string): Promise<string> {
		await mkdir(dirname(this.absoluteDistFilePath), { recursive: true });

		await writeFile(this.absoluteDistFilePath, data);

		return this.absoluteDistFilePath;
	}
}

export class ExtensionComponent {
	public readonly artifactsConfig: ExtensionComponentFileMap<boolean>;
	public readonly readers: ExtensionComponentFileMap<ExtensionFileReader>;
	public readonly emitters: ExtensionComponentFileMap<ExtensionFileEmitter>;

	constructor(
		name: string,
		absoluteSrcDirectoryPath: string,
		absoluteDistDirectoryPath: string,
		artifactsConfig: ExtensionComponentFileMap<boolean> = {}
	) {
		this.artifactsConfig = artifactsConfig;
		this.readers = {};
		this.emitters = {};
		for(const artifactExtension in this.artifactsConfig) {
			if(!this.artifactsConfig[artifactExtension]) continue;

			const fileName: string = `${name}.${artifactExtension}`;

			this.readers[artifactExtension] = new ExtensionFileReader(join(absoluteSrcDirectoryPath, name, fileName));
			this.emitters[artifactExtension] = new ExtensionFileEmitter(join(absoluteDistDirectoryPath, fileName));
		}
	}

	public async build() {
		const emittedFilesPaths: string[] = [];

		for(const artifactExtension in this.artifactsConfig) {
			if(!this.artifactsConfig[artifactExtension]) continue;

			const data: string | NoData = await this.readers[artifactExtension].read();

			if(data === null) continue;

			const emittedFilePath: string = await this.emitters[artifactExtension].toFile(data);

			emittedFilesPaths.push(emittedFilePath);
		}

		return emittedFilesPaths;
	}
}

export class ExtensionBuilder {
	private readonly components: ExtensionComponent[] = [];

	constructor(srcDirectoryPath: string, distDirectoryPath: string, ...components: {
        name: string;
        artifactsConfig?: Partial<ExtensionComponentFileMap<boolean>>;
    }[]) {
		const absoluteSrcDirectoryPath: string = resolve(srcDirectoryPath);
		const absoluteDistDirectoryPath: string = resolve(distDirectoryPath);

		components
            .forEach(component => {
            	const artifactsConfigWithDefaults: ExtensionComponentFileMap<boolean> = {
            		js: true,
            		html: false,
            		css: false,

            		...(component.artifactsConfig ?? {})
            	};

            	this.components.push(
            		new ExtensionComponent(
            			component.name,
            			absoluteSrcDirectoryPath,
            			absoluteDistDirectoryPath,
            			artifactsConfigWithDefaults
            		)
            	);
            });
	}

	public async build(): Promise<string[]> {
		const emittedFilesPaths: string[] = (
			await Promise.all(
				[ ...this.components ]
                    .flatMap((component: ExtensionComponent) => {
                    	return component.build();
                    })
			)
		).flat();

		return emittedFilesPaths.flat();
	}
}