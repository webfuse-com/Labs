type BuildCallback = (rawData: string) => Promise<string>;


export class AssetBundler {
	private readonly buildCb: BuildCallback;

	constructor(buildCb: BuildCallback) {
		this.buildCb = buildCb;
	}

	public build(rawData: string): Promise<string> {
		return this.buildCb(rawData);
	}
}
