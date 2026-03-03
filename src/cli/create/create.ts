import { join, dirname, resolve } from "path";
import { mkdir, rm, cp } from "fs/promises";


const ABSOLUTE_TEMPLATE_DIRECTORY_PATH: string = join(import.meta.dirname, "../../template");
const DEFAULT_TEMPLATE_EMIT_PATH: string = "./my-extension";


export async function create(templatePath: string = DEFAULT_TEMPLATE_EMIT_PATH): Promise<string> {
	const absoluteTemplatePath: string = resolve(templatePath);

	await mkdir(dirname(absoluteTemplatePath), { recursive: true });

	await rm(absoluteTemplatePath, { force: true });
	await cp(ABSOLUTE_TEMPLATE_DIRECTORY_PATH, absoluteTemplatePath, { recursive: true });

	return absoluteTemplatePath;
}