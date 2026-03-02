import { AssetBundler } from "../../tmp/api/AssetBundler.js";


const assetBundler = new AssetBundler(rawData => rawData + "...");

assertEquals(
    assetBundler.build("foo"),
    "foo...",
    "Invalid asset builder result"
);