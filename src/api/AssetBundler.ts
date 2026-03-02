type BuildCallback = (rawData: string, absoluteDirectoryPath?: string) => Promise<string>;


export class AssetBundler {
	private readonly buildCb: BuildCallback;

	constructor(buildCb: BuildCallback) {
		this.buildCb = buildCb;
	}

	public bundle(rawData: string, absoluteDirectoryPath?: string): Promise<string> {
		return this.buildCb(rawData, absoluteDirectoryPath);
	}
}
