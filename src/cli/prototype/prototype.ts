import { join, resolve } from "path";
import { createServer } from "http";
import { stat, readFile } from "fs/promises";

import { print } from "../print.js";


const PROTOTYPING_SERVER_PORT: number = 5000;
const ABSOLUTE_PROTOTYPING_APP_DIRECTORY_PATH: string = join(import.meta.dirname, "./app");
const URL_PREFIX_REGEX: RegExp = /^\/@([a-z]+)(?=\/)/i;
const URL_PREFIX_APP: string = "app";
const URL_PREFIX_BUNDLE: string = "bundle";


export async function prototype(extensionBundleDirectoryPath: string): Promise<void> {
	const absoluteExtensionBundleDirectoryPath: string = resolve(extensionBundleDirectoryPath);

	return new Promise(resolve => {
		createServer(async (req, res) => {
			const endSuccess = (body: string | Buffer) => {
				res.writeHead(200, {
					"Content-Type": "text/plain"
				});
				res.end(body);
			};
			const endError = (status: number = 404, message?: string) => {
				res.writeHead(status);
				res.end(message);
			};

			const tryServeFile = async (absoluteFilePath: string) => {
				try {
					await stat(absoluteFilePath);

					endSuccess(await readFile(absoluteFilePath));
				} catch(err) {
					((err as NodeJS.ErrnoException)?.code === "ENOENT")
						? endError(404)
						: endError(400, (err as Error)?.message ?? String(err));
				}
			};

			const prefix: string = (req.url.match(URL_PREFIX_REGEX) ?? [ "" ])[1];
			const normalizedURLPathname: string = req.url.replace(URL_PREFIX_REGEX, "");
			switch(prefix) {
				case URL_PREFIX_APP: {
					const absoluteFilePath: string = join(ABSOLUTE_PROTOTYPING_APP_DIRECTORY_PATH, normalizedURLPathname);

					tryServeFile(absoluteFilePath);

					return;
				}
				case URL_PREFIX_BUNDLE: {
					const absoluteFilePath: string = join(absoluteExtensionBundleDirectoryPath, normalizedURLPathname);

					endSuccess(await readFile(absoluteFilePath));

					return;
				}
			}

			endError(404);
		})
			.listen(PROTOTYPING_SERVER_PORT, () => {
				print(`Prototyping server running at \x1b[1mhttp://localhost:${PROTOTYPING_SERVER_PORT}\x1b[0m`);

				resolve();
			});
	});
}