import { resolve, dirname, join } from "path";
import { ExtensionComponent, ExtensionComponentType, ExtensionComponentConfig } from "./ExtensionComponent.js";
import { Manifest } from "./Manifest.js";
import { writeFile } from "fs/promises";


export class Extension {
	private readonly manifest: Manifest;
	private readonly components: ExtensionComponent[] = [];
	private readonly absoluteDistDirectoryPath: string;

	constructor(srcDirectoryPath: string, distDirectoryPath: string, ...components: {
		type: ExtensionComponentType
        name: string;
        artifactsConfig?: Partial<ExtensionComponentConfig>;
    }[]) {
		const absoluteSrcDirectoryPath: string = resolve(srcDirectoryPath);
		const absoluteDistDirectoryPath: string = resolve(distDirectoryPath);

		this.absoluteDistDirectoryPath = absoluteDistDirectoryPath;
		this.manifest = new Manifest(dirname(absoluteSrcDirectoryPath));

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
            			absoluteSrcDirectoryPath,
            			absoluteDistDirectoryPath,
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

	public async bundle(): Promise<string[]> {
		const emittedFilesPaths: string[] = (
			await Promise.all(
				[ ...this.components ]
                    .flatMap((component: ExtensionComponent) => {
                    	return component.build();
                    })
			)
		).flat();

		const emitManifestFilePath: string = join(this.absoluteDistDirectoryPath, `manifest.json`);
		await writeFile(emitManifestFilePath, await this.manifest.toString());
		emittedFilesPaths.push(emitManifestFilePath);

		return emittedFilesPaths.flat();
	}
}