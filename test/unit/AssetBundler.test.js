import { AssetBundler } from "../../tmp/api/AssetBundler.js";


const assetBundler = new AssetBundler(rawData => rawData + "...");

assertEquals(
    assetBundler.bundle("foo"),
    "foo...",
    "Invalid asset bundle"
);