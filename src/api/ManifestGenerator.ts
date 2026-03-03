import { join, dirname, resolve, normalize } from "path";
import { readFile, stat } from "fs/promises";


type Atomic = string | number | boolean;
type JSON = {
    [key: string]: Atomic | JSON | (Atomic | JSON)[];
};


export class ManifestGenerator {
	private static async findExtensionPackagePath(initialAbsoluteDirectoryPath: string): Promise<string | null> {
		let currentAbsoluteDirectoryPath: string = initialAbsoluteDirectoryPath;
		while(true) {
			const absolutePackageFilePath: string = join(currentAbsoluteDirectoryPath, "package.json");

			try {
				await stat(absolutePackageFilePath);

				return absolutePackageFilePath;
			} catch {
				const parentAbsoluteDirectoryPath: string = dirname(currentAbsoluteDirectoryPath);
				if (parentAbsoluteDirectoryPath === currentAbsoluteDirectoryPath) break;

				currentAbsoluteDirectoryPath = parentAbsoluteDirectoryPath;
			}
		}

		return null;
	}

	private readonly manifestObject: JSON = {
		manifest_version: 3,
		content_scripts: []
	};
	private readonly absoluteRootDirectoryPath: string;
	private readonly extensionPackagePath?: string;

	constructor(rootDirectoryPath: string, extensionPackagePath?: string) {
		this.absoluteRootDirectoryPath = resolve(rootDirectoryPath);
		this.extensionPackagePath = extensionPackagePath;
	}

	private async readExtensionPackage(): Promise<JSON> {
		const absolutePackageJSONPath: string | null = this.extensionPackagePath
            ?? await ManifestGenerator.findExtensionPackagePath(this.absoluteRootDirectoryPath);

		if(!absolutePackageJSONPath) return {};

		return JSON.parse((await readFile(absolutePackageJSONPath)).toString()) as JSON;
	}

	public addBackgroundScript(relativeScriptPath: string) {
		this.manifestObject.background = (this.manifestObject.background ?? {}) as JSON;
		this.manifestObject.background.service_worker = normalize(relativeScriptPath);
	}

	public addContentScript(relativeScriptPath: string) {
		(this.manifestObject.content_scripts as JSON[])
            .push({
            	js: [ normalize(relativeScriptPath) ],
            	matches: ["<all_urls>"]
            });
	}

	public addPopupMarkup(relativeMarkupPath: string) {
		this.manifestObject.action = (this.manifestObject.action ?? {}) as JSON;
		this.manifestObject.action.default_popup = normalize(relativeMarkupPath);
	}

	public addNewtabMarkup(relativeMarkupPath: string) {
		this.manifestObject.chrome_url_overrides = (this.manifestObject.chrome_url_overrides ?? {}) as JSON;
		this.manifestObject.chrome_url_overrides.newtab = normalize(relativeMarkupPath);
	}

	private async updatePackageFields() {
		const extensionPackageObject: JSON = await this.readExtensionPackage();

		this.manifestObject.name = extensionPackageObject?.name;
		this.manifestObject.version = extensionPackageObject?.version;
	}

	public async toString(): Promise<string> {
		await this.updatePackageFields();

		return JSON.stringify(this.manifestObject, null, 2);
	}

	public async toObject(): Promise<JSON> {
		return JSON.parse(await this.toString()) as JSON;
	}
}