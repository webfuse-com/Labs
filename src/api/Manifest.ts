import { resolve, join, normalize } from "path";
import { readFile, stat } from "fs/promises";


type Atomic = string | number | boolean;
type JSON = {
    [key: string]: Atomic | JSON | (Atomic | JSON)[];
};


export class Manifest {
	private readonly manifestObject: JSON = {
		manifest_version: 3,
		host_permissions: [ "<all_urls>" ],
		content_scripts: [],
		icons: {
			"16": "icon/16.png",
			"32": "icon/32.png",
			"64": "icon/64.png",
			"128": "icon/128.png"
		}
	};
	private readonly absoluteRootDirectoryPath: string;

	constructor(rootDirectoryPath: string) {
		this.absoluteRootDirectoryPath = resolve(rootDirectoryPath);
	}

	private async readExtensionPackage(): Promise<JSON> {
		const absolutePackageFilePath: string = join(this.absoluteRootDirectoryPath, "package.json");

		try {
			await stat(absolutePackageFilePath);
		} catch(err) {
			if((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;

			return {};
		}

		return JSON.parse((await readFile(absolutePackageFilePath)).toString()) as JSON;
	}

	private async updatePackageFields() {
		const extensionPackageObject: JSON = await this.readExtensionPackage();

		this.manifestObject.name = extensionPackageObject?.name;
		this.manifestObject.version = extensionPackageObject?.version;
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

	public addEnv(envObject: Record<string, string>) {
		this.manifestObject.env = envObject;
	}

	public async toString(): Promise<string> {
		await this.updatePackageFields();

		return JSON.stringify(this.manifestObject, null, 2);
	}

	public async toObject(): Promise<JSON> {
		return JSON.parse(await this.toString()) as JSON;
	}
}