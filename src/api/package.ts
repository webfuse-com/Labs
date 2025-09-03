/**
 * Extension package.json read utilities.
 */

import { existsSync } from "fs";
import { join } from "path/posix";

import { ROOT_PATH } from "../constants.js";


export type TPackageJson= {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
};


export async function getPackage(): Promise<TPackageJson> {
	const packageJsonPath = join(ROOT_PATH, "package.json");
	return existsSync(packageJsonPath)
		? (
            (await import(packageJsonPath, { with: { type: "json" } })) as unknown as { default: TPackageJson }
		).default
		: {};
}