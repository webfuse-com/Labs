import { EventEmitter } from "events";
import { stat, mkdir, writeFile } from "fs/promises";

import sharp from "sharp";

import { resolve, dirname, join } from "path";
import { ExtensionComponent, ExtensionComponentType, ExtensionComponentConfig } from "./ExtensionComponent.js";
import { Manifest } from "./Manifest.js";
import { Env } from "./Env.js";


const ICON_SRC_FILE_PATH: string = "./icon.svg";
const ICON_DIST_DIRECTORY_PATH: string = "./icon";
const DIST_PNG_ICON_SIZES_PX: number[] = [ 16, 32, 64, 128 ];
const WATCH_INTERVAL_MS: number = 3000;


export class Extension extends EventEmitter {
	private readonly manifest: Manifest;
	private readonly env: Env;
	private readonly components: ExtensionComponent[] = [];
	private readonly absoluteSrcDirectoryPath: string;
	private readonly absoluteDistDirectoryPath: string;

	private isWatching: boolean = false;
	private watchInterval?: NodeJS.Timeout;

	constructor(srcDirectoryPath: string, distDirectoryPath: string, ...components: {
		type: ExtensionComponentType
        name: string;
        artifactsConfig?: Partial<ExtensionComponentConfig>;
    }[]) {
		super();

		this.absoluteSrcDirectoryPath = resolve(srcDirectoryPath);
		this.absoluteDistDirectoryPath = resolve(distDirectoryPath);

		this.manifest = new Manifest(dirname(this.absoluteSrcDirectoryPath));
		this.env = new Env(dirname(this.absoluteSrcDirectoryPath));

		components
            .forEach(component => {
            	const artifactsConfigWithDefaults: ExtensionComponentConfig = {
            		js: { enabled: true },
            		html: { enabled: false },
            		css: { enabled: false },

            		...(component.artifactsConfig ?? {})
            	};

            	this.components.push(
            		new ExtensionComponent(
            			component.type,
            			component.name,
            			this.absoluteSrcDirectoryPath,
            			this.absoluteDistDirectoryPath,
            			artifactsConfigWithDefaults
            		)
            	);

            	switch(component.type) {
            		case "background":
            			this.manifest.addBackgroundScript(join(component.name, `${component.name}.js`));

            			break;
            		case "content":
            			this.manifest.addContentScript(join(component.name, `${component.name}.js`));

            			break;
            		case "popup":
            			this.manifest.addPopupMarkup(join(component.name, `${component.name}.html`));

            			break;
            		case "newtab":
            			this.manifest.addNewtabMarkup(join(component.name, `${component.name}.html`));

            			break;
            	}
            });
	}

	public toggleWatch() {
		clearInterval(this.watchInterval);

		this.isWatching = !this.isWatching;

		if(!this.isWatching) return;

		const watchCb = (() => this.bundle()).bind(this) as () => void;

		this.watchInterval = setInterval(watchCb, WATCH_INTERVAL_MS);
	}

	public async bundle(): Promise<string[]> {
		const emittedFilesPaths: string[] = (
			await Promise.all(
				[ ...this.components ]
                    .map((component: ExtensionComponent) => {
                    	return component.build();
                    })
			)
		).flat();

		// TODO: Conditional adjacent asset emission (modified?)
		if(!emittedFilesPaths.length) return[]

		this.manifest.addEnv(await this.env.toObject());

		const emitManifestFilePath: string = join(this.absoluteDistDirectoryPath, `manifest.json`);
		await writeFile(emitManifestFilePath, await this.manifest.toString());
		emittedFilesPaths.push(emitManifestFilePath);

		// TODO: to dedicated class
		try {
			const iconSrcFilePath: string = join(this.absoluteSrcDirectoryPath, ICON_SRC_FILE_PATH);

			await stat(iconSrcFilePath);

			const absoluteIconDistDirectoryPath: string = join(this.absoluteDistDirectoryPath, ICON_DIST_DIRECTORY_PATH);

			await mkdir(absoluteIconDistDirectoryPath, { recursive: true });

			const emitIconFilePaths: string[] = await Promise.all(
				DIST_PNG_ICON_SIZES_PX
					.map(async (iconSizePx: number) => {
						const absoluteIconFilePath: string = join(this.absoluteDistDirectoryPath, ICON_DIST_DIRECTORY_PATH, `${iconSizePx}.png`);

						await sharp(iconSrcFilePath)
							.resize({ height: iconSizePx })
							.png()
							.toFile(absoluteIconFilePath);

						return absoluteIconFilePath;
					})
			);
			emittedFilesPaths.push(...emitIconFilePaths)
		} catch (err) {
			if((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
		}

		emittedFilesPaths.length
			&& this.emit("bundle", emittedFilesPaths);

		return emittedFilesPaths;
	}
}